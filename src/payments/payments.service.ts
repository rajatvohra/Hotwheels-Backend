import { Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from 'src/stores/entities/store.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Store)
    private readonly stores: Repository<Store>,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, storeId }: CreatePaymentInput,
  ): Promise<CreatePaymentOuput> {
    try {
      const store = await this.stores.findOne(storeId);
      if (!store) {
        return {
          ok: false,
          error: 'Store not found.',
        };
      }
      if (store.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'You are not allowed to do this.',
        };
      }
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          store,
        }),
      );
      store.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      store.promotedUntil = date;
      this.stores.save(store);
      return {
        ok: true,
      };
    } catch {
      return { ok: false, error: 'Could not create payment.' };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: user });
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load payments.',
      };
    }
  }

  async checkPromotedStores() {
    const stores = await this.stores.find({
      isPromoted: true,
      promotedUntil: LessThan(new Date()),
    });
    console.log(stores);
    stores.forEach(async store => {
      store.isPromoted = false;
      store.promotedUntil = null;
      await this.stores.save(store);
    });
  }
}