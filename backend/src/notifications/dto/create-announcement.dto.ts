import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'School Closed Tomorrow' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Due to heavy rain, school will be closed tomorrow.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: '2026-11-10' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}