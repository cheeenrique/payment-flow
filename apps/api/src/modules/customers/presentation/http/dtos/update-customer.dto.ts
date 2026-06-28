import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** DTO de atualização parcial de cliente — todos os campos são opcionais */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(18)
  document?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
