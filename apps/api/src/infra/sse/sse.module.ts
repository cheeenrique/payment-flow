import { Module } from '@nestjs/common';
import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { SseJwtGuard } from './sse-jwt.guard';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  // AuthModule reexporta o JwtModule, fornecendo o JwtService que o guard injeta.
  imports: [AuthModule],
  controllers: [SseController],
  providers: [SseService, SseJwtGuard],
  exports: [SseService],
})
export class SseModule {}
