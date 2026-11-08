import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@iscms.local', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@1234', description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;
}