import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/stores/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { FeedbackInput, FeedbackOutput } from './dtos/create-feedback.dto';
import { FeedbacksInput, FeedbacksOutput } from './dtos/feedbacks.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(Feedback)
    private readonly feedbacks: Repository<Feedback>,
  ) {}

  async createFeedback(
    customer: User,
    feedbackInput: FeedbackInput,
  ): Promise<FeedbackOutput> {
    try {
      let canGiveFb = false;
      const orders = await this.orders.find({
        where: { customer: { id: customer.id } },
        relations: ['product'],
      });
      orders.forEach(order => {
        if (
          order.productId === feedbackInput.productId &&
          order.FeedbackExists === false
        ) {
          canGiveFb = true;
          order.FeedbackExists = true;
          this.orders.save(order);
        }
      });
      if (canGiveFb) {
        const feedback = this.feedbacks.create({ ...feedbackInput, customer });
        feedback.product = await this.products.findOne({
          where: { id: feedbackInput.productId },
        });
        await this.feedbacks.save(feedback);
        return {
          ok: true,
        };
      }
      return {
        ok: false,
        error: 'You didnt buy this product',
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not create feedback.',
      };
    }
  }

  async allFeedbacks(feedbackInput: FeedbacksInput): Promise<FeedbacksOutput> {
    try {
      const [seeFeedbacks, totalResults] = await this.feedbacks.findAndCount({
        where: {
          product: {
            id: feedbackInput.productId,
          },
        },
        skip: (feedbackInput.page - 1) * 25,
        take: 25,
        relations: ['customer'],
      });
      return {
        ok: true,
        results: seeFeedbacks,
        totalPages: Math.ceil(totalResults / 3),
        totalResults,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not return feedbacks',
      };
    }
  }
}
