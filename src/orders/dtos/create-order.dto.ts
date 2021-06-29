import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateOrderInput {
  @Field(type => Int)
  storeId: number;

  @Field(type => Int)
  productId: number;

  @Field(type => Int)
  quantity?: number;
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {
  @Field(type => Int, { nullable: true })
  orderId?: number;
}

@InputType()
export class CreateOrderOfflineInput {
  @Field(type => Int)
  storeId: number;

  @Field(type => Int)
  productId: number;

  @Field(type => Int)
  quantity?: number;
}

@ObjectType()
export class CreateOrderOfflineOutput extends CoreOutput {
  @Field(type => Int, { nullable: true })
  orderId?: number;
}
