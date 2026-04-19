import {
  Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE } from '../../database/database.module';
import { lapkins, lapkinRows, lapkinRowActivities, users } from '../../database/schema';
import { LapkinGateway } from '../websocket/lapkin.gateway';
import {
  CreateLapkinDto, CreateLapkinRowDto, UpdateLapkinRowDto, ManagerUpdateRowScoresDto,
  LapkinResponseDto, LapkinRowResponseDto,
  LapkinRowActivityItemDto, LapkinRowActivityResponseDto,
} from './lapkin.dto';
import { RequestUser } from '../../common/types';

const REST_ACTIVITY_LABEL = 'Istirahat';

@Injectable()
export class LapkinService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly gateway: LapkinGateway,
  ) { }

  async findAllForUser(user: RequestUser): Promise<LapkinResponseDto[]> {
    if (user.role === 'pegawai') return this.findByEmployee(user.id);
    if (user.role === 'manager') return this.findForManager(user.id);
    return this.findAll();
  }

  async findOne(id: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(id);
    await this.assertCanViewLapkin(lapkin, user);
    return lapkin;
  }

  async create(dto: CreateLapkinDto, employeeId: string): Promise<LapkinResponseDto> {
    const [created] = await this.db
      .insert(lapkins)
      .values({ reportDate: dto.reportDate, employeeId, status: 'draft' })
      .returning();
    return this.buildLapkinResponse(created.id);
  }

  async lock(lapkinId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);
    if (lapkin.status === 'evaluated') throw new BadRequestException('Cannot lock an evaluated LAPKIN');
    await this.updateStatus(lapkinId, 'locked');
    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyManagerLapkinLocked(updated);
    return updated;
  }

  async unlock(lapkinId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);
    if (lapkin.status === 'evaluated') throw new BadRequestException('Cannot unlock an evaluated LAPKIN');
    if (lapkin.status === 'draft') throw new BadRequestException('LAPKIN is already in draft');
    await this.db
      .update(lapkins)
      .set({ status: 'draft', employeeSignedAt: null, updatedAt: new Date() })
      .where(eq(lapkins.id, lapkinId));
    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyManagerLapkinUnlocked(updated);
    return updated;
  }

  async addRow(lapkinId: string, dto: CreateLapkinRowDto, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);
    this.assertIsDraft(lapkin);

    const existingRows = await this.db
      .select({ lineNumber: lapkinRows.lineNumber })
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId))
      .orderBy(lapkinRows.lineNumber);

    const nextLine =
      existingRows.length > 0 ? existingRows[existingRows.length - 1].lineNumber + 1 : 1;

    this.assertValidActivities(dto.activities);

    const [inserted] = await this.db
      .insert(lapkinRows)
      .values({
        lapkinId,
        lineNumber: nextLine,
        startTime: dto.startTime,
        endTime: dto.endTime,
      })
      .returning();

    await this.insertActivities(inserted.id, dto.activities);

    return this.buildLapkinResponse(lapkinId);
  }

  async updateRow(
    lapkinId: string, rowId: string, dto: UpdateLapkinRowDto, user: RequestUser,
  ): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);
    this.assertIsDraft(lapkin);
    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    if (dto.activities !== undefined) {
      this.assertValidActivities(dto.activities);
    }

    await this.db.update(lapkinRows).set({
      ...(dto.startTime !== undefined && { startTime: dto.startTime }),
      ...(dto.endTime !== undefined && { endTime: dto.endTime }),
      updatedAt: new Date(),
    }).where(eq(lapkinRows.id, rowId));

    if (dto.activities !== undefined) {
      await this.db.delete(lapkinRowActivities).where(eq(lapkinRowActivities.lapkinRowId, rowId));
      await this.insertActivities(rowId, dto.activities);
    }

    return this.buildLapkinResponse(lapkinId);
  }

  async deleteRow(lapkinId: string, rowId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);
    this.assertIsDraft(lapkin);
    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    await this.db.delete(lapkinRows).where(eq(lapkinRows.id, rowId));

    const remaining = await this.db
      .select({ id: lapkinRows.id })
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId))
      .orderBy(lapkinRows.lineNumber);

    for (let i = 0; i < remaining.length; i++) {
      await this.db.update(lapkinRows).set({ lineNumber: i + 1 }).where(eq(lapkinRows.id, remaining[i].id));
    }

    return this.buildLapkinResponse(lapkinId);
  }

  async managerUpdateRowScores(
    lapkinId: string,
    rowId: string,
    dto: ManagerUpdateRowScoresDto,
    manager: RequestUser,
  ): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    await this.assertManagerOwnsDirectReport(lapkin.employeeId, manager.id);

    if (lapkin.status !== 'locked') {
      throw new BadRequestException('Can only edit scores on a LOCKED LAPKIN');
    }
    if (lapkin.isSignedByManager) {
      throw new BadRequestException('Cannot edit scores after the LAPKIN has been signed by the appraiser');
    }

    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    const rowDto = lapkin.rows.find((r) => r.id === rowId);
    if (!rowDto) throw new NotFoundException('Row not found');

    const existingActs = await this.db
      .select()
      .from(lapkinRowActivities)
      .where(eq(lapkinRowActivities.lapkinRowId, rowId))
      .orderBy(asc(lapkinRowActivities.sortOrder));

    if (dto.activities.length !== existingActs.length) {
      throw new BadRequestException('Activity count does not match this row');
    }

    const enriched: LapkinRowActivityItemDto[] = dto.activities.map((item, index) => {
      const ex = existingActs[index];
      const isRest = ex.isRest === true;
      if (
        item.taskDescription?.trim() !== ex.taskDescription.trim()
        || item.resultDescription?.trim() !== ex.resultDescription.trim()
        || (item.isRest === true) !== isRest
      ) {
        throw new BadRequestException('Activity descriptions cannot be changed when updating scores');
      }

      if (isRest) {
        return {
          taskDescription: ex.taskDescription,
          resultDescription: ex.resultDescription,
          isRest: true,
          performancePercent: null,
          fieldDutyPercent: null,
          notWorkingPercent: null,
          finalScore: null,
          notes: ex.notes?.trim() ? ex.notes.trim() : null,
        };
      }

      const perf = item.performancePercent;
      const field = item.fieldDutyPercent;
      if (perf == null || field == null) {
        throw new BadRequestException('Hasil kinerja and tugas dinas luar are required for each work activity');
      }

      const notWorking = item.notWorkingPercent ?? 0;
      const finalScore = (perf + field) / 2;

      return {
        taskDescription: ex.taskDescription,
        resultDescription: ex.resultDescription,
        isRest: false,
        performancePercent: perf,
        fieldDutyPercent: field,
        notWorkingPercent: notWorking,
        finalScore,
        notes: ex.notes?.trim() ? ex.notes.trim() : null,
      };
    });

    await this.db.delete(lapkinRowActivities).where(eq(lapkinRowActivities.lapkinRowId, rowId));
    await this.insertActivities(rowId, enriched);

    return this.buildLapkinResponse(lapkinId);
  }

  async evaluateRow(
    lapkinId: string, rowId: string, manager: RequestUser,
  ): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    await this.assertManagerOwnsDirectReport(lapkin.employeeId, manager.id);

    if (lapkin.status !== 'locked') {
      throw new BadRequestException('Can only evaluate a LOCKED LAPKIN');
    }

    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    const rowDto = lapkin.rows.find((r) => r.id === rowId);
    if (rowDto && !rowDto.managerAcknowledged) {
      const acts = rowDto.activities;
      for (const a of acts) {
        if (a.isRest) continue;
        if (
          a.performancePercent == null
          || a.fieldDutyPercent == null
          || a.notWorkingPercent == null
        ) {
          throw new BadRequestException(
            'Fill hasil kinerja, tugas dinas luar, and tidak masuk kerja for all work activities before reviewing',
          );
        }
      }
    }

    await this.db.update(lapkinRows).set({
      managerAcknowledged: true,
      updatedAt: new Date(),
    }).where(eq(lapkinRows.id, rowId));

    const updated = await this.buildLapkinResponse(lapkinId);
    return updated;
  }

  async deleteLapkin(lapkinId: string, user: RequestUser): Promise<void> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);
    if (lapkin.status === 'evaluated') throw new BadRequestException('Cannot delete an evaluated LAPKIN');
    await this.db.delete(lapkins).where(eq(lapkins.id, lapkinId));
  }

  private async findByEmployee(employeeId: string): Promise<LapkinResponseDto[]> {
    const records = await this.db
      .select({ id: lapkins.id })
      .from(lapkins)
      .where(eq(lapkins.employeeId, employeeId))
      .orderBy(lapkins.reportDate);

    return Promise.all(records.map((r: { id: string }) => this.buildLapkinResponse(r.id)));
  }

  private async findForManager(managerId: string): Promise<LapkinResponseDto[]> {
    const directReports = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.managerId, managerId));

    if (!directReports.length) return [];

    const reportIds = directReports.map((u: { id: string }) => u.id);
    const records = await this.db
      .select({ id: lapkins.id })
      .from(lapkins)
      .where(
        and(
          inArray(lapkins.employeeId, reportIds),
          inArray(lapkins.status, ['locked', 'evaluated']),
        ),
      )
      .orderBy(lapkins.reportDate);

    return Promise.all(records.map((r: { id: string }) => this.buildLapkinResponse(r.id)));
  }

  private async findAll(): Promise<LapkinResponseDto[]> {
    const records = await this.db
      .select({ id: lapkins.id })
      .from(lapkins)
      .orderBy(lapkins.reportDate);

    return Promise.all(records.map((r: { id: string }) => this.buildLapkinResponse(r.id)));
  }

  private async buildLapkinResponse(lapkinId: string): Promise<LapkinResponseDto> {
    const managers = alias(users, 'managers');

    const [lapkin] = await this.db
      .select({
        id: lapkins.id,
        reportDate: lapkins.reportDate,
        status: lapkins.status,
        employeeId: lapkins.employeeId,
        employeeName: users.name,
        employeeNip: users.nip,
        employeeJobTitle: users.jobTitle,
        managerId: users.managerId,
        managerName: managers.name,
        managerNip: managers.nip,
        managerJobTitle: managers.jobTitle,
        employeeSignatureUrl: users.signatureDataUrl,
        managerSignatureUrl: managers.signatureDataUrl,
        employeeSignedAt: lapkins.employeeSignedAt,
        managerSignedAt: lapkins.managerSignedAt,
        createdAt: lapkins.createdAt,
        updatedAt: lapkins.updatedAt,
      })
      .from(lapkins)
      .innerJoin(users, eq(lapkins.employeeId, users.id))
      .leftJoin(managers, eq(users.managerId, managers.id))
      .where(eq(lapkins.id, lapkinId))
      .limit(1);

    if (!lapkin) throw new NotFoundException('LAPKIN not found');

    const rowsRaw = await this.db
      .select()
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId))
      .orderBy(lapkinRows.lineNumber);

    const rowIds = rowsRaw.map((r: { id: string }) => r.id);
    const activitiesRaw = rowIds.length === 0
      ? []
      : await this.db
        .select()
        .from(lapkinRowActivities)
        .where(inArray(lapkinRowActivities.lapkinRowId, rowIds))
        .orderBy(asc(lapkinRowActivities.lapkinRowId), asc(lapkinRowActivities.sortOrder));

    const byRow = new Map<string, typeof lapkinRowActivities.$inferSelect[]>();
    for (const a of activitiesRaw) {
      const list = byRow.get(a.lapkinRowId) ?? [];
      list.push(a);
      byRow.set(a.lapkinRowId, list);
    }

    const rows: LapkinRowResponseDto[] = rowsRaw.map((r: typeof lapkinRows.$inferSelect) =>
      this.mapRowToDto(r, byRow.get(r.id) ?? []));

    const managerSignedRaw = lapkin.managerSignedAt as Date | null | undefined;
    const employeeSignedRaw = lapkin.employeeSignedAt as Date | null | undefined;

    return {
      ...lapkin,
      reportDate: String(lapkin.reportDate),
      employeeSignedAt: employeeSignedRaw ? new Date(employeeSignedRaw).toISOString() : null,
      isSignedByEmployee: employeeSignedRaw != null,
      managerSignedAt: managerSignedRaw ? new Date(managerSignedRaw).toISOString() : null,
      isSignedByManager: managerSignedRaw != null,
      rows,
    };
  }

  async signLapkinByEmployee(lapkinId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsEmployeeOwner(lapkin, user);

    if (lapkin.status !== 'locked' && lapkin.status !== 'evaluated') {
      throw new BadRequestException('LAPKIN must be locked or evaluated before you can sign it');
    }
    if (lapkin.isSignedByEmployee) {
      throw new BadRequestException('LAPKIN is already signed by you');
    }
    if (!lapkin.employeeSignatureUrl) {
      throw new BadRequestException('Add your signature under My account before signing this LAPKIN');
    }

    await this.db
      .update(lapkins)
      .set({ employeeSignedAt: new Date(), updatedAt: new Date() })
      .where(eq(lapkins.id, lapkinId));

    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyManagerLapkinEmployeeSigned(updated);
    return updated;
  }

  async signLapkinByManager(lapkinId: string, manager: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    await this.assertManagerOwnsDirectReport(lapkin.employeeId, manager.id);

    if (lapkin.status !== 'locked') {
      throw new BadRequestException('LAPKIN must be locked before sign-off');
    }
    if (lapkin.isSignedByManager) {
      throw new BadRequestException('LAPKIN is already signed by the appraiser');
    }
    if (!lapkin.managerSignatureUrl) {
      throw new BadRequestException('Add your signature under My account before signing this LAPKIN');
    }
    if (!this.allEvaluableRowsAcknowledged(lapkin)) {
      throw new BadRequestException('Acknowledge all work rows before signing this LAPKIN');
    }

    await this.db
      .update(lapkins)
      .set({
        managerSignedAt: new Date(),
        status: 'evaluated',
        updatedAt: new Date(),
      })
      .where(eq(lapkins.id, lapkinId));

    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyPegawaiLapkinEvaluated(updated);
    return updated;
  }

  private allEvaluableRowsAcknowledged(lapkin: LapkinResponseDto): boolean {
    const rowsNeedingAck = lapkin.rows.filter((r) => {
      const acts = r.activities ?? [];
      return acts.length > 0 && acts.some((a) => !a.isRest);
    });
    if (rowsNeedingAck.length === 0) return true;
    return rowsNeedingAck.every((r) => r.managerAcknowledged);
  }

  private mapRowToDto(
    row: typeof lapkinRows.$inferSelect,
    activities: typeof lapkinRowActivities.$inferSelect[],
  ): LapkinRowResponseDto {
    return {
      id: row.id,
      lapkinId: row.lapkinId,
      lineNumber: row.lineNumber,
      startTime: row.startTime,
      endTime: row.endTime,
      activities: activities.map((a) => this.mapActivityToDto(a)),
      managerAcknowledged: row.managerAcknowledged,
    };
  }

  private mapActivityToDto(a: typeof lapkinRowActivities.$inferSelect): LapkinRowActivityResponseDto {
    return {
      taskDescription: a.taskDescription,
      resultDescription: a.resultDescription,
      performancePercent: a.performancePercent != null ? String(a.performancePercent) : null,
      fieldDutyPercent: a.fieldDutyPercent != null ? String(a.fieldDutyPercent) : null,
      finalScore: a.finalScore != null ? String(a.finalScore) : null,
      notWorkingPercent: a.notWorkingPercent != null ? String(a.notWorkingPercent) : null,
      isRest: a.isRest,
      notes: a.notes ?? null,
    };
  }

  private assertValidActivities(items: LapkinRowActivityItemDto[] | undefined): void {
    if (!items?.length) {
      throw new BadRequestException('At least one activity is required');
    }
    for (const item of items) {
      if (item.isRest === true) continue;
      if (!item.taskDescription?.trim() || !item.resultDescription?.trim()) {
        throw new BadRequestException('Each activity must have task and result descriptions');
      }
    }
  }

  private async insertActivities(rowId: string, items: LapkinRowActivityItemDto[]): Promise<void> {
    const values = items.map((item, index) => {
      const isRest = item.isRest === true;
      return {
        lapkinRowId: rowId,
        sortOrder: index + 1,
        taskDescription: isRest ? REST_ACTIVITY_LABEL : item.taskDescription.trim(),
        resultDescription: isRest ? REST_ACTIVITY_LABEL : item.resultDescription.trim(),
        performancePercent: item.performancePercent != null ? String(item.performancePercent) : null,
        fieldDutyPercent: item.fieldDutyPercent != null ? String(item.fieldDutyPercent) : null,
        finalScore: item.finalScore != null ? String(item.finalScore) : null,
        notWorkingPercent: item.notWorkingPercent != null ? String(item.notWorkingPercent) : null,
        isRest,
        notes: item.notes?.trim() ? item.notes.trim() : null,
      };
    });
    if (values.length) {
      await this.db.insert(lapkinRowActivities).values(values);
    }
  }

  private async updateStatus(lapkinId: string, status: 'draft' | 'locked' | 'evaluated'): Promise<void> {
    await this.db.update(lapkins).set({ status, updatedAt: new Date() }).where(eq(lapkins.id, lapkinId));
  }

  private async assertRowBelongsToLapkin(rowId: string, lapkinId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: lapkinRows.id })
      .from(lapkinRows)
      .where(and(eq(lapkinRows.id, rowId), eq(lapkinRows.lapkinId, lapkinId)))
      .limit(1);
    if (!row) throw new NotFoundException('Row not found in this LAPKIN');
  }

  private async assertManagerOwnsDirectReport(employeeId: string, managerId: string): Promise<void> {
    const [report] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, employeeId), eq(users.managerId, managerId)))
      .limit(1);
    if (!report) throw new ForbiddenException('This employee is not your direct report');
  }

  private assertIsEmployeeOwner(lapkin: LapkinResponseDto, user: RequestUser): void {
    if (lapkin.employeeId !== user.id) throw new ForbiddenException('This LAPKIN does not belong to you');
  }

  private assertIsDraft(lapkin: LapkinResponseDto): void {
    if (lapkin.status !== 'draft') throw new BadRequestException('LAPKIN must be in DRAFT status to edit');
  }

  private async assertCanViewLapkin(lapkin: LapkinResponseDto, user: RequestUser): Promise<void> {
    if (user.role === 'admin') return;
    if (user.role === 'pegawai' && lapkin.employeeId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role === 'manager') {
      if (lapkin.status === 'draft') {
        throw new ForbiddenException('Managers cannot view draft LAPKINs');
      }
      await this.assertManagerOwnsDirectReport(lapkin.employeeId, user.id);
    }
  }
}
