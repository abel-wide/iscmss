import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ example: 'teacher1@iscms.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Teacher@1234' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Abebe Kebede' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '0911223344' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'BSc in Math' })
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiPropertyOptional({ example: 'Mathematics' })
  @IsString()
  @IsOptional()
  subjectSpecialty?: string;
}