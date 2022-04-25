import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../shared/shared.module';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { UserCreateAction } from './services/UserCreateAction.service';
import { UserFindByIdlAction } from './services/UserFindByIdAction.service';

@Module({
  controllers: [UserController],
  imports: [SharedModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UserCreateAction, UserFindByIdlAction],
  exports: [UserCreateAction, UserFindByIdlAction],
})
export class UserModule {}
