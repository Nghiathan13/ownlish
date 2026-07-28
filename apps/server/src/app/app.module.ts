import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';
import { DictationModule } from '../dictation/dictation.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { ToeicRuntimeModule } from '../features/toeic-runtime/toeic-runtime.module';
import { UsersModule } from '../users/users.module';
import { VocabModule } from '../vocab/vocab.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    VocabModule,
    CollectionsModule,
    DictationModule,
    ReviewsModule,
    ToeicRuntimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
