import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @ApiProperty({ example: 'staff@iscmss.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Dr. Abebe Bekele' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: [Role.HEAD, Role.REGISTRAR, Role.ADMIN], example: Role.HEAD })
  @IsEnum(Role)
  role: Role;
}
