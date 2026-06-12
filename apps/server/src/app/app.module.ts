import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';
import { UsersModule } from '../users/users.module';
import { VocabModule } from '../vocab/vocab.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [UsersModule, AuthModule, VocabModule, CollectionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
