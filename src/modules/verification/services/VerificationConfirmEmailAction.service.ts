/* eslint-disable unicorn/import-style */
/* eslint-disable unicorn/prefer-node-protocol */
/* eslint-disable new-cap */
/* eslint-disable unicorn/prefer-module */
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import omit from 'lodash';
import * as mongoose from 'mongoose';
import { RequestContext } from 'src/utils/RequestContext';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/modules/user/user.schema';
import { UserConfirmationTokenDto } from 'src/modules/user/dtos/UserConfirmationToken.dto';
import { NotFoundException } from 'src/utils/exceptions/NotFoundException';
import { STATUS } from 'src/domain/const';
import { ConfigService } from '../../../configs/config.service';
import { VerificationConfirmEmailQueryDto } from '../dtos/VerificationConfirmEmailQuery.dto';
import { StripeService } from '../../../shared/services/stripe.service';
import { ForbiddenException } from '../../../utils/exceptions/ForbiddenException';

@Injectable()
export class VerificationConfirmEmailAction {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private configService: ConfigService,
    private stripeService: StripeService,
    private jwtService: JwtService,
  ) {}

  async execute(
    context: RequestContext,
    query: VerificationConfirmEmailQueryDto,
  ): Promise<User | null> {
    try {
      const decodedJwtEmailToken = this.jwtService.decode(query.token);
      const { email } = <UserConfirmationTokenDto>decodedJwtEmailToken;
      const checkExistedUser = await this.userModel.findOne({ $or: [{ email }] });

      if (!checkExistedUser) {
        throw new NotFoundException('User', 'User not found');
      }

      if (checkExistedUser.status === STATUS.ACTIVE) {
        throw new ForbiddenException('User has already active');
      }
      const fullName = `${checkExistedUser.firstName} ${checkExistedUser.lastName}`;
      const customerInfo = await this.stripeService.createCustomerUser(context, fullName, email);
      const user = await this.userModel.findByIdAndUpdate(checkExistedUser.id, {
        status: STATUS.ACTIVE,
        stripeCustomerUserId: customerInfo.id,
      });

      return user;
    } catch (error) {
      context.logger.error(error);
      throw new ForbiddenException(error.message || 'User token not found');
    }
  }
}
