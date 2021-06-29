import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Store } from './entities/store.entity';
import { CategoryRepository } from './repositories/category.repository';
import {
  CategoryResolver,
  ProductResolver,
  StoreResolver,
} from './stores.resolver';
import { Storeservice } from './stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Product, CategoryRepository])],
  providers: [
    StoreResolver,
    CategoryResolver,
    ProductResolver,
    Storeservice,
  ],
})
export class StoresModule {}