import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Store } from '../entities/store.entity';

@InputType()
export class MyStoreInput extends PickType(Store, ['id']) {}

@ObjectType()
export class MyStoreOutput extends CoreOutput {
  @Field(type => Store, { nullable: true })
  store?: Store;
}