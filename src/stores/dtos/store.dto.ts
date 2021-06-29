import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Store } from '../entities/store.entity';

@InputType()
export class StoreInput {
  @Field(type => Int)
  storeId: number;
}

@ObjectType()
export class StoreOutput extends CoreOutput {
  @Field(type => Store, { nullable: true })
  store?: Store;
}