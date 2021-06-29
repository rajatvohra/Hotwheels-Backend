import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { InternalServerErrorException } from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsString,
} from 'class-validator';
import { Store } from 'src/stores/entities/store.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Feedback } from 'src/feedbacks/entities/feedback.entity';

@InputType('lntLngUserType')
@ObjectType()
export class latLngUser {
  @Field((type) => Number, { defaultValue: 40.639751 })
  lat: number;
  @Field((type) => Number, { defaultValue: -73.778925 })
  lng: number;
}

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Retailer = 'Retailer',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field((type) => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Column()
  @Field((type) => String)
  @IsString()
  location: string;

  @Field((type) => latLngUser, {
    defaultValue: {
      lat: -73.778925,
      lng: 40.639751,
    },
  })
  @Column({
    type: 'json',
    default: {
      lat: -73.778925,
      lng: 40.639751,
    },
  })
  _geoloc?: latLngUser;

  @Column({ type: 'enum', enum: UserRole })
  @Field((type) => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field((type) => Boolean)
  @IsBoolean()
  verified: boolean;

  @Column({ default: 0 })
  @Field((type) => Number)
  @IsNumber()
  otp?: Number;

  @Field((type) => [Store])
  @OneToMany((type) => Store, (store) => store.owner)
  stores: Store[];

  @Field((type) => [Feedback])
  @OneToMany((type) => Feedback, (feedback) => feedback.customer)
  feedbacks: Feedback[];

  @Field((type) => [Order])
  @OneToMany((type) => Order, (order) => order.customer)
  orders: Order[];

  @Field((type) => [Payment])
  @OneToMany((type) => Payment, (payment) => payment.user)
  payments: Payment[];

  @Field((type) => [Order])
  @OneToMany((type) => Order, (order) => order.driver)
  rides: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(aPassword, this.password);
      return ok;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
