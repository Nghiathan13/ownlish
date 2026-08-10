import { AuthModule } from '../auth/auth.module';
import { CollectionsModule } from '../collections/collections.module';
import { DictationModule } from '../dictation/dictation.module';
import { LearningActivityModule } from '../features/learning-activity/learning-activity.module';
import { ToeicRuntimeModule } from '../features/toeic-runtime/toeic-runtime.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersModule } from '../users/users.module';
import { VocabModule } from '../vocab/vocab.module';
import { AppController } from './app.controller';
import { AppModule } from './app.module';
import { AppService } from './app.service';

describe('AppModule', () => {
  it('registers every application feature at the root module', () => {
    expect(Reflect.getMetadata('imports', AppModule)).toEqual([
      UsersModule,
      AuthModule,
      VocabModule,
      CollectionsModule,
      DictationModule,
      ReviewsModule,
      ToeicRuntimeModule,
      LearningActivityModule,
    ]);
    expect(Reflect.getMetadata('controllers', AppModule)).toEqual([
      AppController,
    ]);
    expect(Reflect.getMetadata('providers', AppModule)).toEqual([AppService]);
  });
});
