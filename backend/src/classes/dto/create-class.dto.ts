import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Grade 5A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  gradeLevel: number;

  @ApiProperty({ example: '2026' })
  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @ApiPropertyOptional({ description: 'Room Teacher User ID (አማራጭ)' })
  @IsUUID()
  @IsOptional()
  roomTeacherId?: string;
}