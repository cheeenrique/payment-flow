import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { Permissions } from '@/modules/auth/domain/rbac/permissions';
import { CreateChargeUseCase } from '@/modules/charges/application/use-cases/create-charge.use-case';
import { CancelChargeUseCase } from '@/modules/charges/application/use-cases/cancel-charge.use-case';
import { GetChargeUseCase } from '@/modules/charges/application/use-cases/get-charge.use-case';
import { ListChargesUseCase } from '@/modules/charges/application/use-cases/list-charges.use-case';
import { CreateChargeDto } from './dtos/create-charge.dto';
import { ListChargesQueryDto } from './dtos/list-charges-query.dto';

/**
 * Controller REST do módulo charges (lado de comando — CQRS pragmático).
 * Responsável por: criar cobranças, listar, buscar e cancelar.
 * Toda rota exige autenticação JWT (JwtAuthGuard) + permissão (PermissionsGuard).
 */
@Controller('charges')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChargesController {
  constructor(
    private readonly createChargeUseCase: CreateChargeUseCase,
    private readonly cancelChargeUseCase: CancelChargeUseCase,
    private readonly getChargeUseCase: GetChargeUseCase,
    private readonly listChargesUseCase: ListChargesUseCase,
  ) {}

  /** POST /charges — cria uma nova cobrança em status "pending" */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permissions.ChargesCreate)
  handleCreate(@Body() dto: CreateChargeDto) {
    return this.createChargeUseCase.execute({
      customerId: dto.customerId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      description: dto.description,
      expiresAt: new Date(dto.expiresAt),
    });
  }

  /** GET /charges — lista cobranças paginadas com filtros opcionais */
  @Get()
  @RequirePermissions(Permissions.ChargesRead)
  handleList(@Query() query: ListChargesQueryDto) {
    return this.listChargesUseCase.execute({
      status: query.status,
      customerId: query.customerId,
      page: query.page,
      limit: query.limit,
    });
  }

  /** GET /charges/:id — retorna detalhes de uma cobrança específica */
  @Get(':id')
  @RequirePermissions(Permissions.ChargesRead)
  handleGet(@Param('id') id: string) {
    return this.getChargeUseCase.execute(id);
  }

  /** POST /charges/:id/cancel — cancela a cobrança se o estado permitir */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permissions.ChargesUpdate)
  handleCancel(@Param('id') id: string) {
    return this.cancelChargeUseCase.execute(id);
  }
}
