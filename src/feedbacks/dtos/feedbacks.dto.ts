import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Feedback } from '../entities/feedback.entity';

@InputType()
export class FeedbacksInput extends PaginationInput {
    @Field((type) => Number)
  productId: number;
}

@ObjectType()
export class FeedbacksOutput extends PaginationOutput {
  @Field((type) => [Feedback], { nullable: true })
  results?: Feedback[];
}
