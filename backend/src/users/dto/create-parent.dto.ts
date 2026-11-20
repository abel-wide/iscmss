import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParentDto {
  @ApiProperty({ example: 'parent@iscmss.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'ParentPass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Almaz Tadesse' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '+251922334455' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Mother' })
  @IsString()
  @IsOptional()
  relationship?: string;

  @ApiPropertyOptional({ type: [String], description: 'Optional Student IDs to link immediately' })
  @IsArray()
  @IsOptional()
  studentIds?: string[];
}
