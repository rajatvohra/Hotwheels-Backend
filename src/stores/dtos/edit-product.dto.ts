import {
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Product } from '../entities/product.entity';

@InputType()
export class EditProductInput extends PickType(PartialType(Product), [
  'name',
  'options',
  'price',
  'description',
  'photo',
  'stocks',
  'dateNextAvailable',
]) {
  @Field((type) => Int)
  productId: number;

  @Field((type) => String, { nullable: true })
  categoryName?: string;
}

@ObjectType()
export class EditProductOutput extends CoreOutput {}
