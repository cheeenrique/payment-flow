import { IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** DTO para regras de simulação do PIX */
export class PixRulesDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  successRate!: number;

  @IsNumber()
  @Min(0)
  maxDelayMs!: number;
}

/** DTO para regras de simulação do Boleto */
export class BoletoRulesDto {
  @IsNumber()
  @Min(0)
  delayMs!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  successRate!: number;
}

/** DTO para regras de simulação do Cartão de Crédito */
export class CreditCardRulesDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  successRate!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  riskFactor!: number;
}

/**
 * DTO para atualização parcial da configuração do simulador.
 * Todos os campos são opcionais — campos omitidos mantêm valor atual.
 */
export class UpdateSimulatorConfigDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PixRulesDto)
  pix?: PixRulesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BoletoRulesDto)
  boleto?: BoletoRulesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardRulesDto)
  creditCard?: CreditCardRulesDto;
}
