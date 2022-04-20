import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User, UserDocument } from '../user.schema';

@Injectable()
export class UserCreateAction {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async execute(email: string): Promise<User> {
    const user = await this.userModel.findOne({ $or: [{ email: email }] });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }
}
