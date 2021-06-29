import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Product } from '../entities/product.entity';

@InputType()
export class ProductsInput extends PaginationInput {}

@ObjectType()
export class ProductsOutput extends PaginationOutput {
  @Field((type) => [Product], { nullable: true })
  results?: Product[];
}
