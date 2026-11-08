import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAttendanceDto } from './create-attendance.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BulkAttendanceDto {
  @ApiProperty({ type: [CreateAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttendanceDto)
  attendances: CreateAttendanceDto[];
}