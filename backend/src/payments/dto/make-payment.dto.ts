import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MakePaymentDto {
  @ApiProperty({ example: 'CHAPA-12345' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}