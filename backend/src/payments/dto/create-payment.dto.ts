import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 'Payment for Semester 1' })
  @IsString()
  @IsOptional()
  description?: string;
}