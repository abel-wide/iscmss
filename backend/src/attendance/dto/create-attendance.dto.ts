import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: '2026-11-06' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 'TEACHER', description: 'TEACHER ወይም SELF_FINGERPRINT' })
  @IsString()
  @IsOptional()
  method?: string;
}