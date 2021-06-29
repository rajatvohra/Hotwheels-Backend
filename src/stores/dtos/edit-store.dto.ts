import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CreateStoreInput } from './create-store.dto';

@InputType()
export class EditStoreInput extends PartialType(CreateStoreInput) {
  @Field((type) => Number)
  storeId: number;
}

@ObjectType()
export class EditStoreOutput extends CoreOutput {}
