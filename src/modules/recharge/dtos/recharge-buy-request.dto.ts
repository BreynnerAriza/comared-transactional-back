import {
  IsString,
  IsNotEmpty,
  Matches,
  Length,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class RechargeBuyRequestDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsNumber()
  @Min(1000)
  @Max(100000)
  value: number;

  @IsString()
  @Length(10, 10)
  @Matches(/^3[0-9]{9}$/)
  cellPhone: string;
}
