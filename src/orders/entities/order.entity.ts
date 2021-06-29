import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Product } from 'src/stores/entities/product.entity';
import { Store } from 'src/stores/entities/store.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

export enum OrderStatus {
  Pending = 'Pending',
  Packing = 'Packing',
  Packed = 'Packed',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

export enum OrderMode {
  Offline = 'Offline',
  Online = 'Online',
}

registerEnumType(OrderMode, { name: 'OrderMode' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @Field((type) => Store, { nullable: true })
  @ManyToOne((type) => Store, (store) => store.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  store?: Store;

  @Field((type) => Product)
  @ManyToOne((type) => Product, {
    nullable: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  product: Product;

  @RelationId((order: Order) => order.product)
  productId: number;

  @Field((type) => Float, { defaultValue: 1 })
  @Column({ default: 1 })
  @IsNumber()
  quantity?: number;

  @Column({ nullable: true })
  @Field((type) => Float, { nullable: true })
  @IsNumber()
  total?: number;

  @Column({ default: false })
  @Field((type) => Boolean, { defaultValue: false })
  @IsBoolean()
  FeedbackExists?: boolean;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field((type) => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Column({ type: 'enum', enum: OrderMode, default: OrderMode.Online })
  @Field((type) => OrderMode)
  @IsEnum(OrderMode)
  mode: OrderMode;
}
