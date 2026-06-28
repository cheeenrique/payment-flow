/**
 * Entidade de configuração do simulador.
 * Representa as regras de comportamento por método de pagamento.
 * Imutável — atualizações geram nova instância via withUpdates().
 */

/** Regras de simulação para pagamentos via PIX */
export interface PixRules {
  /** Taxa de aprovação — valor entre 0 e 1 */
  successRate: number;
  /** Delay máximo de processamento em milissegundos */
  maxDelayMs: number;
}

/** Regras de simulação para pagamentos via Boleto */
export interface BoletoRules {
  /** Delay de compensação simulado em milissegundos (ex.: 300_000 = 5 min) */
  delayMs: number;
  /** Taxa de pagamento efetivo — valor entre 0 e 1 */
  successRate: number;
}

/** Regras de simulação para pagamentos via Cartão de Crédito */
export interface CreditCardRules {
  /** Taxa de aprovação pela adquirente — valor entre 0 e 1 */
  successRate: number;
  /** Fator de risco sistêmico — aumenta probabilidade de erro do PSP (0 a 1) */
  riskFactor: number;
}

export interface SimulatorConfigProps {
  id: string;
  pix: PixRules;
  boleto: BoletoRules;
  creditCard: CreditCardRules;
  updatedAt: Date;
}

export class SimulatorConfig {
  readonly id: string;
  readonly pix: PixRules;
  readonly boleto: BoletoRules;
  readonly creditCard: CreditCardRules;
  readonly updatedAt: Date;

  /** ID fixo para a configuração global singleton */
  static readonly GLOBAL_ID = 'global';

  /** Valores padrão conforme especificação do domínio do simulador */
  static readonly DEFAULTS: Readonly<Pick<SimulatorConfigProps, 'pix' | 'boleto' | 'creditCard'>> = {
    pix: { successRate: 0.95, maxDelayMs: 3_000 },
    boleto: { delayMs: 300_000, successRate: 0.90 },
    creditCard: { successRate: 0.80, riskFactor: 0.3 },
  };

  constructor(props: SimulatorConfigProps) {
    this.id = props.id;
    this.pix = props.pix;
    this.boleto = props.boleto;
    this.creditCard = props.creditCard;
    this.updatedAt = props.updatedAt;
  }

  /** Cria instância com valores padrão de fábrica */
  static createDefault(): SimulatorConfig {
    return new SimulatorConfig({
      id: SimulatorConfig.GLOBAL_ID,
      ...SimulatorConfig.DEFAULTS,
      updatedAt: new Date(),
    });
  }

  /** Retorna nova instância com campos parcialmente substituídos (imutável) */
  withUpdates(
    partial: Partial<Pick<SimulatorConfigProps, 'pix' | 'boleto' | 'creditCard'>>,
  ): SimulatorConfig {
    return new SimulatorConfig({
      id: this.id,
      pix: partial.pix ?? this.pix,
      boleto: partial.boleto ?? this.boleto,
      creditCard: partial.creditCard ?? this.creditCard,
      updatedAt: new Date(),
    });
  }
}
