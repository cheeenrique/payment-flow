import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { Permissions } from '@/modules/auth/domain/rbac/permissions';
import { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '@/modules/customers/application/use-cases/update-customer.use-case';
import { DeactivateCustomerUseCase } from '@/modules/customers/application/use-cases/deactivate-customer.use-case';
import { FindCustomerUseCase } from '@/modules/customers/application/use-cases/find-customer.use-case';
import { ListCustomersUseCase } from '@/modules/customers/application/use-cases/list-customers.use-case';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { UpdateCustomerDto } from './dtos/update-customer.dto';
import { ListCustomersDto } from './dtos/list-customers.dto';

/**
 * Controller REST de clientes — responsável apenas por comandos (escrita).
 * Operações administrativas: exigem permissões customers:* (concedidas
 * apenas ao admin via wildcard). Autenticação + autorização por guards.
 */
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly deactivateCustomer: DeactivateCustomerUseCase,
    private readonly findCustomer: FindCustomerUseCase,
    private readonly listCustomers: ListCustomersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permissions.CustomersCreate)
  handleCreate(@Body() dto: CreateCustomerDto) {
    return this.createCustomer.execute({
      name: dto.name,
      email: dto.email,
      document: dto.document,
      phone: dto.phone,
    });
  }

  @Get()
  @RequirePermissions(Permissions.CustomersRead)
  handleList(@Query() dto: ListCustomersDto) {
    return this.listCustomers.execute({ page: dto.page, limit: dto.limit });
  }

  @Get(':id')
  @RequirePermissions(Permissions.CustomersRead)
  handleFindById(@Param('id') id: string) {
    return this.findCustomer.execute(id);
  }

  @Put(':id')
  @RequirePermissions(Permissions.CustomersUpdate)
  handleUpdate(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.updateCustomer.execute({
      id,
      name: dto.name,
      document: dto.document,
      phone: dto.phone,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permissions.CustomersDelete)
  async handleDeactivate(@Param('id') id: string): Promise<void> {
    await this.deactivateCustomer.execute(id);
  }
}
