import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ example: 'Chapter 1 Notes' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'PDF' })
  @IsString()
  @IsNotEmpty()
  type: string; // PDF, VIDEO, LINK

  @ApiProperty({ example: 'https://example.com/file.pdf' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Teacher ID' })
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;
}