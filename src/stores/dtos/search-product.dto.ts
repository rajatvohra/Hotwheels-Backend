import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Product } from '../entities/product.entity';

@InputType()
export class SearchProductInput extends PaginationInput {
  @Field((type) => String)
  query: string;
}

@ObjectType()
export class SearchProductOutput extends PaginationOutput {
  @Field((type) => [Product], { nullable: true })
  products?: Product[];
}
