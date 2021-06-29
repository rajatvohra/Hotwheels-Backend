import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Json } from 'aws-sdk/clients/robomaker';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { Product } from './product.entity';

@InputType('lntLngStoreType')
@ObjectType()
export class latLngStore {
  @Field((type) => Number, { defaultValue: 40.639751 })
  lat: number;
  @Field((type) => Number, { defaultValue: -73.778925 })
  lng: number;
}
@InputType('StoreInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Store extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @Field((type) => latLngStore, {
    defaultValue: {
      lat: 40.639751,
      lng: -73.778925,
    },
  })
  @Column({
    type: 'json',
    default: {
      lat: 40.639751,
      lng: -73.778925,
    },
  })
  _geoloc?: latLngStore;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.stores, {
    onDelete: 'CASCADE',
    eager: true,
  })
  owner: User;

  @RelationId((store: Store) => store.owner)
  ownerId: number;

  @Field((type) => [Order])
  @OneToMany((type) => Order, (order) => order.store)
  orders: Order[];

  @Field((type) => [Product])
  @OneToMany((type) => Product, (product) => product.store)
  menu: Product[];

  @Field((type) => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  @Field((type) => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil: Date;
}
