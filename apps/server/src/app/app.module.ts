import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { TestsModule } from '../tests/tests.module';
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
    ReviewsModule,
    TestsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
