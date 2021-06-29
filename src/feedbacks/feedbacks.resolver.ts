
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { FeedbackInput, FeedbackOutput } from './dtos/create-feedback.dto';
import { FeedbacksInput, FeedbacksOutput } from './dtos/feedbacks.dto';
import { FeedbackService } from './feedbacks.service';

@Resolver()
export class FeedbackResolver {
  constructor(private readonly feedbackService: FeedbackService) {}
  @Mutation((returns) => FeedbackOutput)
  @Role(['Client', 'Retailer'])
  async createFeedback(
    @AuthUser() customer: User,
    @Args('input')
    feedbackInput: FeedbackInput,
  ): Promise<FeedbackOutput> {
    return this.feedbackService.createFeedback(customer, feedbackInput);
  }

  @Query((returns) => FeedbacksOutput)
  @Role(['Client', 'Retailer'])
  async feedbacks(
    @AuthUser() customer: User,
    @Args('input')
    feedbackInput: FeedbacksInput,
  ): Promise<FeedbacksOutput> {
    return this.feedbackService.allFeedbacks(feedbackInput);
  }
}
