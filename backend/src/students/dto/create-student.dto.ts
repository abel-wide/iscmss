import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'student1@iscms.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Student@1234' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Hana Bekele' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '0911223344' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'WCU-2026-001' })
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @ApiProperty({ example: '2010-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.FEMALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ description: 'Class ID' })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Parent ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}