import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class RechargeHistoryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size: number = 10;
}
