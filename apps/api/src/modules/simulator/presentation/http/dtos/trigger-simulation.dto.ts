import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { SimulatorPaymentMethod } from '@/modules/simulator/application/use-cases/process-payment-simulation.use-case';

/**
 * DTO para disparo manual de simulação via POST /simulator/trigger.
 * Usa paymentId (não chargeId) para que o veredito chegue diretamente ao Payment
 * já existente — evita o mapeamento intermediário da decisão paralela antiga.
 */
export class TriggerSimulationDto {
  /** ID do pagamento a ser simulado */
  @IsString()
  paymentId!: string;

  /** Método de pagamento que define as regras de simulação aplicadas */
  @IsEnum(['pix', 'boleto', 'credit_card'])
  paymentMethod!: SimulatorPaymentMethod;

  /** ID de correlação para rastreamento — gerado automaticamente se omitido */
  @IsOptional()
  @IsString()
  correlationId?: string;
}
