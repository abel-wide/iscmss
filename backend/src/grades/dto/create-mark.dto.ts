import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarkDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: 'Teacher ID', required: false })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({ example: 35, description: 'Assessment mark (0-40)' })
  @IsNumber()
  @Min(0)
  @Max(40)
  assessment: number;

  @ApiProperty({ example: 50, description: 'Final exam mark (0-60)' })
  @IsNumber()
  @Min(0)
  @Max(60)
  finalExam: number;
}