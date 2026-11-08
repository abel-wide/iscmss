import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Parent ID' })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ example: 'Absence Alert' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your child was marked absent today.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'ABSENCE', description: 'ABSENCE, GRADE, PAYMENT, ANNOUNCEMENT' })
  @IsString()
  @IsNotEmpty()
  type: string;
}