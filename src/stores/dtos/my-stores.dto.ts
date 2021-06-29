import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Store } from '../entities/store.entity';

@ObjectType()
export class MyStoresOutput extends CoreOutput {
  @Field(type => [Store])
  stores?: Store[];
}