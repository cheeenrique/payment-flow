import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** DTO de criação de cliente — validado na borda pela ValidationPipe global */
export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsEmail()
  email!: string;

  /** CPF (11 dígitos) ou CNPJ (14 dígitos) — validação de formato simulada */
  @IsString()
  @MinLength(11)
  @MaxLength(18)
  document!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
