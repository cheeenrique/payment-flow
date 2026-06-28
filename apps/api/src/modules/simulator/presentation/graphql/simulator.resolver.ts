import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { GetSimulatorConfigUseCase } from '@/modules/simulator/application/use-cases/get-simulator-config.use-case';
import { SimulatorConfigType } from './types/simulator-config.type';

/**
 * Resolver GraphQL code-first para o módulo Simulator — lado de leitura (query).
 * Segue CQRS pragmático do projeto: REST para comandos, GraphQL para consultas.
 *
 * Pré-requisito: GraphQLModule registrado no AppModule com driver ApolloDriver.
 */
@Resolver(() => SimulatorConfigType)
export class SimulatorResolver {
  constructor(
    private readonly getConfigUseCase: GetSimulatorConfigUseCase,
  ) {}

  /**
   * query simulatorConfig: retorna a configuração atual do simulador.
   * Requer autenticação JWT.
   */
  @Query(() => SimulatorConfigType, {
    name: 'simulatorConfig',
    description: 'Retorna a configuração de simulação atual (regras por método de pagamento)',
  })
  @UseGuards(GqlAuthGuard)
  async getSimulatorConfig(): Promise<SimulatorConfigType> {
    const config = await this.getConfigUseCase.execute();

    return {
      id: config.id,
      pix: config.pix,
      boleto: config.boleto,
      creditCard: config.creditCard,
      // Serializado como ISO 8601 — evita dependência de scalar Date customizado
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
