import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Product } from '../entities/product.entity';

@InputType()
export class CreateProductInput extends PickType(Product, [
  'name',
  'price',
  'description',
  'options',
  'photo',
  'stocks',
]) {
  @Field((type) => Int)
  storeId: number;

  @Field((type) => String)
  categoryName: string;
}

@ObjectType()
export class CreateProductOutput extends CoreOutput {
  @Field((type) => Int)
  productId?: number;
}
