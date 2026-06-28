import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Argumentos para a query de listagem global da timeline */
@ArgsType()
export class TimelineArgs {
  @Field(() => Int, {
    nullable: true,
    defaultValue: 1,
    description: 'Página de eventos a retornar (base 1)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Número máximo de eventos por página',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

/** Argumentos para queries de timeline filtradas por aggregate */
@ArgsType()
export class TimelineByAggregateArgs {
  @Field({ description: 'ID do aggregate cujos eventos serão retornados' })
  @IsString()
  aggregateId!: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 100,
    description: 'Número máximo de eventos a retornar',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
