import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Product } from '../entities/product.entity';

@InputType()
export class ProductInput {
  @Field((type) => Int)
  productId: number;
}

@ObjectType()
export class ProductOutput extends CoreOutput {
  @Field((type) => Product, { nullable: true })
  product?: Product;
}
