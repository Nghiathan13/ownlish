import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { VocabModule } from '../vocab/vocab.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [UsersModule, AuthModule, VocabModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
