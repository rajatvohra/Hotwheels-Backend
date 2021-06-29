import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class LoginInput extends PickType(User, [
  'email',
  'password',
  '_geoloc',
]) {}

@ObjectType()
export class LoginOutput extends CoreOutput {
  @Field((type) => Number, { nullable: true })
  userId?: Number;
}
