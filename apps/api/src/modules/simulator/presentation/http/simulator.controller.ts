import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { Permissions } from '@/modules/auth/domain/rbac/permissions';
import { GetSimulatorConfigUseCase } from '@/modules/simulator/application/use-cases/get-simulator-config.use-case';
import { UpdateSimulatorConfigUseCase } from '@/modules/simulator/application/use-cases/update-simulator-config.use-case';
import { ResetSimulatorConfigUseCase } from '@/modules/simulator/application/use-cases/reset-simulator-config.use-case';
import { ProcessPaymentSimulationUseCase } from '@/modules/simulator/application/use-cases/process-payment-simulation.use-case';
import { UpdateSimulatorConfigDto } from './dtos/update-simulator-config.dto';
import { TriggerSimulationDto } from './dtos/trigger-simulation.dto';
import type { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';

interface TriggerResponse {
  scheduled: boolean;
  paymentId: string;
  correlationId: string;
}

/**
 * Controlador REST do simulador — lado de comando (escrita).
 * Operações administrativas: leitura exige simulator:read; alterações exigem
 * simulator:manage; o trigger de simulação exige payments:simulate.
 * Autenticação (JwtAuthGuard) + autorização (PermissionsGuard).
 */
@Controller('simulator')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SimulatorController {
  constructor(
    private readonly getConfigUseCase: GetSimulatorConfigUseCase,
    private readonly updateConfigUseCase: UpdateSimulatorConfigUseCase,
    private readonly resetConfigUseCase: ResetSimulatorConfigUseCase,
    private readonly processSimulationUseCase: ProcessPaymentSimulationUseCase,
  ) {}

  /** GET /simulator/config — retorna a configuração atual do simulador */
  @Get('config')
  @RequirePermissions(Permissions.SimulatorRead)
  async handleGetConfig(): Promise<SimulatorConfig> {
    return this.getConfigUseCase.execute();
  }

  /** POST /simulator/config — atualiza regras de simulação por método de pagamento */
  @Post('config')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permissions.SimulatorManage)
  async handleUpdateConfig(@Body() dto: UpdateSimulatorConfigDto): Promise<SimulatorConfig> {
    return this.updateConfigUseCase.execute(dto);
  }

  /**
   * POST /simulator/trigger — dispara simulação manual para um pagamento existente.
   * Usa paymentId (não chargeId): o veredito chega diretamente ao Payment sem
   * mapeamento intermediário. Retorna 202 Accepted (processamento assíncrono).
   */
  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermissions(Permissions.PaymentsSimulate)
  async handleTrigger(@Body() dto: TriggerSimulationDto): Promise<TriggerResponse> {
    const correlationId = dto.correlationId ?? randomUUID();

    await this.processSimulationUseCase.execute({
      paymentId: dto.paymentId,
      method: dto.paymentMethod,
      correlationId,
    });

    return { scheduled: true, paymentId: dto.paymentId, correlationId };
  }

  /** POST /simulator/reset — restaura valores padrão de fábrica */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permissions.SimulatorManage)
  async handleReset(): Promise<SimulatorConfig> {
    return this.resetConfigUseCase.execute();
  }
}
