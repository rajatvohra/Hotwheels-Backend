import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from 'src/common/dtos/pagination.dto';
import { Product } from '../entities/product.entity';

@InputType()
export class FilterProductInput extends PaginationInput {
    @Field(()=>Number,{defaultValue:200})
    radiusInKm?:Number;
}

@ObjectType()
export class FilterProductOutput extends PaginationOutput {
  @Field((type) => [Product], { nullable: true })
  products?: Product[];
}

