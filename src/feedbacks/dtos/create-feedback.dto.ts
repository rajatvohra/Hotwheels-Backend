import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Feedback } from '../entities/feedback.entity';

@InputType()
export class FeedbackInput extends PickType(Feedback, ['complaint']){
  @Field((type) => Int)
  productId: number;
}

@ObjectType()
export class FeedbackOutput extends CoreOutput {}
