import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode,
} from '@nestjs/common';
import { LapkinService } from './lapkin.service';
import { CreateLapkinDto, CreateLapkinRowDto, UpdateLapkinRowDto, EvaluateRowDto } from './lapkin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { RequestUser } from '../../common/types';

@Controller('lapkins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LapkinController {
  constructor(private readonly lapkinService: LapkinService) { }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.lapkinService.findAllForUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.lapkinService.findOne(id, user);
  }

  @Post()
  @Roles('pegawai')
  create(@Body() dto: CreateLapkinDto, @CurrentUser() user: RequestUser) {
    return this.lapkinService.create(dto, user.id);
  }

  @Delete(':id')
  @Roles('pegawai')
  @HttpCode(204)
  deleteLapkin(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.lapkinService.deleteLapkin(id, user);
  }

  @Patch(':id/lock')
  @Roles('pegawai')
  lock(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.lapkinService.lock(id, user);
  }

  @Patch(':id/unlock')
  @Roles('pegawai')
  unlock(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.lapkinService.unlock(id, user);
  }

  @Post(':id/rows')
  @Roles('pegawai')
  addRow(
    @Param('id') id: string,
    @Body() dto: CreateLapkinRowDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lapkinService.addRow(id, dto, user);
  }

  @Patch(':id/rows/:rowId')
  @Roles('pegawai')
  updateRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateLapkinRowDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lapkinService.updateRow(id, rowId, dto, user);
  }

  @Delete(':id/rows/:rowId')
  @Roles('pegawai')
  @HttpCode(204)
  deleteRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lapkinService.deleteRow(id, rowId, user);
  }

  @Patch(':id/rows/:rowId/evaluate')
  @Roles('manager')
  evaluateRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: EvaluateRowDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.lapkinService.evaluateRow(id, rowId, dto, user);
  }
}
