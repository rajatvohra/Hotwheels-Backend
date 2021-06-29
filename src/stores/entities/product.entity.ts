import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Feedback } from 'src/feedbacks/entities/feedback.entity';
import { UserRole } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { latLngStore, Store } from './store.entity';

@InputType('ProductChoiceInputType', { isAbstract: true })
@ObjectType()
class ProductChoice {
  @Field((type) => String)
  name: string;
  @Field((type) => Int, { nullable: true })
  extra?: number;
}

@InputType('ProductOptionInputType', { isAbstract: true })
@ObjectType()
export class ProductOption {
  @Field((type) => String)
  name: string;
  @Field((type) => [ProductChoice], { nullable: true })
  choices?: ProductChoice[];
  @Field((type) => Int, { nullable: true })
  extra?: number;
}

@InputType('ProductInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Product extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo: string;

  @Field((type) => String)
  @Column()
  @Length(5, 400)
  description: string;

  @Field((type) => Store)
  @ManyToOne((type) => Store, (store) => store.menu, {
    onDelete: 'CASCADE',
    eager: true,
  })
  store: Store;

  @RelationId((product: Product) => product.store)
  storeId: number;

  @Field((type) => [ProductOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: ProductOption[];

  @Field((type) => Category, { nullable: true })
  @ManyToOne((type) => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  category: Category;

  @Field((type) => Feedback, { nullable: true })
  @OneToMany((type) => Feedback, (feedback) => feedback.product, {
    onDelete: 'CASCADE',
  })
  feedback: Feedback[];

  @Field((type) => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  @IsNumber()
  stocks: number;

  @Field((type) => String, { defaultValue: 'Today' })
  @Column({ default: 'Today' })
  dateNextAvailable: string;

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  // @Field((type) => UserRole, { nullable: true })
  @IsEnum(UserRole)
  productRole: UserRole;

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
}
