import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';


@InputType()
export class OTPInput extends PickType(User, ['otp','id']) {}


@ObjectType()
export class OTPOutput extends CoreOutput {
    @Field(type => String, { nullable: true })
    token?: string;
}


