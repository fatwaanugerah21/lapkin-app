import {
  Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE } from '../../database/database.module';
import { lapkins, lapkinRows, users } from '../../database/schema';
import { LapkinGateway } from '../websocket/lapkin.gateway';
import {
  CreateLapkinDto, CreateLapkinRowDto, UpdateLapkinRowDto,
  EvaluateRowDto, LapkinResponseDto,
} from './lapkin.dto';
import { RequestUser } from '../../common/types';

@Injectable()
export class LapkinService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly gateway: LapkinGateway,
  ) {}

  async findAllForUser(user: RequestUser): Promise<LapkinResponseDto[]> {
    if (user.role === 'pegawai') return this.findByPegawai(user.id);
    if (user.role === 'manager') return this.findForManager(user.id);
    return this.findAll();
  }

  async findOne(id: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(id);
    this.assertCanViewLapkin(lapkin, user);
    return lapkin;
  }

  async create(dto: CreateLapkinDto, pegawaiId: string): Promise<LapkinResponseDto> {
    const [created] = await this.db
      .insert(lapkins)
      .values({ tanggal: dto.tanggal, pegawaiId, status: 'draft' })
      .returning();
    return this.buildLapkinResponse(created.id);
  }

  async lock(lapkinId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsPegawaiOwner(lapkin, user);
    if (lapkin.status === 'evaluated') throw new BadRequestException('Cannot lock an evaluated LAPKIN');
    await this.updateStatus(lapkinId, 'locked');
    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyManagerLapkinLocked(updated);
    return updated;
  }

  async unlock(lapkinId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsPegawaiOwner(lapkin, user);
    if (lapkin.status === 'evaluated') throw new BadRequestException('Cannot unlock an evaluated LAPKIN');
    if (lapkin.status === 'draft') throw new BadRequestException('LAPKIN is already in draft');
    await this.updateStatus(lapkinId, 'draft');
    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyManagerLapkinUnlocked(updated);
    return updated;
  }

  async addRow(lapkinId: string, dto: CreateLapkinRowDto, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsPegawaiOwner(lapkin, user);
    this.assertIsDraft(lapkin);

    const existingRows = await this.db
      .select({ no: lapkinRows.no })
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId))
      .orderBy(lapkinRows.no);

    const nextNo = existingRows.length > 0 ? existingRows[existingRows.length - 1].no + 1 : 1;

    await this.db.insert(lapkinRows).values({
      lapkinId,
      no: nextNo,
      waktuMulai: dto.waktuMulai,
      waktuSelesai: dto.waktuSelesai,
      uraianTugas: dto.uraianTugas,
      uraianHasil: dto.uraianHasil,
      hasilKinerja: dto.hasilKinerja?.toString() ?? null,
      tugasDinasLuar: dto.tugasDinasLuar?.toString() ?? null,
      ket: dto.ket ?? null,
    });

    return this.buildLapkinResponse(lapkinId);
  }

  async updateRow(
    lapkinId: string, rowId: string, dto: UpdateLapkinRowDto, user: RequestUser,
  ): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsPegawaiOwner(lapkin, user);
    this.assertIsDraft(lapkin);
    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    await this.db.update(lapkinRows).set({
      ...(dto.waktuMulai !== undefined && { waktuMulai: dto.waktuMulai }),
      ...(dto.waktuSelesai !== undefined && { waktuSelesai: dto.waktuSelesai }),
      ...(dto.uraianTugas !== undefined && { uraianTugas: dto.uraianTugas }),
      ...(dto.uraianHasil !== undefined && { uraianHasil: dto.uraianHasil }),
      ...(dto.hasilKinerja !== undefined && { hasilKinerja: dto.hasilKinerja?.toString() ?? null }),
      ...(dto.tugasDinasLuar !== undefined && { tugasDinasLuar: dto.tugasDinasLuar?.toString() ?? null }),
      ...(dto.ket !== undefined && { ket: dto.ket }),
      updatedAt: new Date(),
    }).where(eq(lapkinRows.id, rowId));

    return this.buildLapkinResponse(lapkinId);
  }

  async deleteRow(lapkinId: string, rowId: string, user: RequestUser): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsPegawaiOwner(lapkin, user);
    this.assertIsDraft(lapkin);
    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    await this.db.delete(lapkinRows).where(eq(lapkinRows.id, rowId));

    // Re-number rows sequentially after deletion
    const remaining = await this.db
      .select({ id: lapkinRows.id })
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId))
      .orderBy(lapkinRows.no);

    for (let i = 0; i < remaining.length; i++) {
      await this.db.update(lapkinRows).set({ no: i + 1 }).where(eq(lapkinRows.id, remaining[i].id));
    }

    return this.buildLapkinResponse(lapkinId);
  }

  async evaluateRow(
    lapkinId: string, rowId: string, dto: EvaluateRowDto, manager: RequestUser,
  ): Promise<LapkinResponseDto> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    await this.assertManagerOwnsDirectReport(lapkin.pegawaiId, manager.id);

    if (lapkin.status !== 'locked') {
      throw new BadRequestException('Can only evaluate a LOCKED LAPKIN');
    }

    await this.assertRowBelongsToLapkin(rowId, lapkinId);

    await this.db.update(lapkinRows).set({
      nilaiAkhir: dto.nilaiAkhir.toString(),
      updatedAt: new Date(),
    }).where(eq(lapkinRows.id, rowId));

    // If all rows have nilaiAkhir, mark as evaluated
    const allRows = await this.db
      .select({ nilaiAkhir: lapkinRows.nilaiAkhir })
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId));

    const allEvaluated = allRows.length > 0 && allRows.every((r: any) => r.nilaiAkhir !== null);
    if (allEvaluated) {
      await this.updateStatus(lapkinId, 'evaluated');
    }

    const updated = await this.buildLapkinResponse(lapkinId);
    this.gateway.notifyPegawaiLapkinEvaluated(updated);
    return updated;
  }

  async deleteLapkin(lapkinId: string, user: RequestUser): Promise<void> {
    const lapkin = await this.buildLapkinResponse(lapkinId);
    this.assertIsPegawaiOwner(lapkin, user);
    if (lapkin.status === 'evaluated') throw new BadRequestException('Cannot delete an evaluated LAPKIN');
    await this.db.delete(lapkins).where(eq(lapkins.id, lapkinId));
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findByPegawai(pegawaiId: string): Promise<LapkinResponseDto[]> {
    const records = await this.db
      .select({ id: lapkins.id })
      .from(lapkins)
      .where(eq(lapkins.pegawaiId, pegawaiId))
      .orderBy(lapkins.tanggal);

    return Promise.all(records.map((r: any) => this.buildLapkinResponse(r.id)));
  }

  private async findForManager(managerId: string): Promise<LapkinResponseDto[]> {
    const directReports = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.managerId, managerId));

    if (!directReports.length) return [];

    const reportIds = directReports.map((u: any) => u.id);
    const records = await this.db
      .select({ id: lapkins.id })
      .from(lapkins)
      .where(inArray(lapkins.pegawaiId, reportIds))
      .orderBy(lapkins.tanggal);

    return Promise.all(records.map((r: any) => this.buildLapkinResponse(r.id)));
  }

  private async findAll(): Promise<LapkinResponseDto[]> {
    const records = await this.db
      .select({ id: lapkins.id })
      .from(lapkins)
      .orderBy(lapkins.tanggal);

    return Promise.all(records.map((r: any) => this.buildLapkinResponse(r.id)));
  }

  private async buildLapkinResponse(lapkinId: string): Promise<LapkinResponseDto> {
    const managers = alias(users, 'managers');

    const [lapkin] = await this.db
      .select({
        id: lapkins.id,
        tanggal: lapkins.tanggal,
        status: lapkins.status,
        pegawaiId: lapkins.pegawaiId,
        pegawaiName: users.name,
        pegawaiNip: users.nip,
        pegawaiJabatan: users.jabatan,
        managerName: managers.name,
        managerJabatan: managers.jabatan,
        createdAt: lapkins.createdAt,
        updatedAt: lapkins.updatedAt,
      })
      .from(lapkins)
      .innerJoin(users, eq(lapkins.pegawaiId, users.id))
      .leftJoin(managers, eq(users.managerId, managers.id))
      .where(eq(lapkins.id, lapkinId))
      .limit(1);

    if (!lapkin) throw new NotFoundException('LAPKIN not found');

    const rows = await this.db
      .select()
      .from(lapkinRows)
      .where(eq(lapkinRows.lapkinId, lapkinId))
      .orderBy(lapkinRows.no);

    return { ...lapkin, rows };
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

  private async assertManagerOwnsDirectReport(pegawaiId: string, managerId: string): Promise<void> {
    const [report] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, pegawaiId), eq(users.managerId, managerId)))
      .limit(1);
    if (!report) throw new ForbiddenException('This employee is not your direct report');
  }

  private assertIsPegawaiOwner(lapkin: LapkinResponseDto, user: RequestUser): void {
    if (lapkin.pegawaiId !== user.id) throw new ForbiddenException('This LAPKIN does not belong to you');
  }

  private assertIsDraft(lapkin: LapkinResponseDto): void {
    if (lapkin.status !== 'draft') throw new BadRequestException('LAPKIN must be in DRAFT status to edit');
  }

  private assertCanViewLapkin(lapkin: LapkinResponseDto, user: RequestUser): void {
    if (user.role === 'admin') return;
    if (user.role === 'pegawai' && lapkin.pegawaiId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
  }
}
