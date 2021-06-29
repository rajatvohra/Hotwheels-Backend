import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { In, Like, Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  CreateProductInput,
  CreateProductOutput,
} from './dtos/create-product.dto';
import { CreateStoreInput, CreateStoreOutput } from './dtos/create-store.dto';
import {
  DeleteProductInput,
  DeleteProductOutput,
} from './dtos/delete-product.dto';
import { DeleteStoreInput, DeleteStoreOutput } from './dtos/delete-store.dto';
import { EditProductInput, EditProductOutput } from './dtos/edit-product.dto';
import { EditStoreInput, EditStoreOutput } from './dtos/edit-store.dto';
import { MyStoreInput, MyStoreOutput } from './dtos/my-store';
import { MyStoresOutput } from './dtos/my-stores.dto';
import { StoreInput, StoreOutput } from './dtos/store.dto';
import { StoresInput, StoresOutput } from './dtos/stores.dto';
import { SearchStoreInput, SearchStoreOutput } from './dtos/search-store.dto';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Store } from './entities/store.entity';
import { CategoryRepository } from './repositories/category.repository';
import {
  SearchProductInput,
  SearchProductOutput,
} from './dtos/search-product.dto';
import { ProductInput, ProductOutput } from './dtos/product.dto';
import { ProductsInput, ProductsOutput } from './dtos/products.dto';

import algoliasearch from 'algoliasearch';
import { response } from 'express';
import {
  FilterProductInput,
  FilterProductOutput,
} from './dtos/filter-product-by-location.dto';
@Injectable()
export class Storeservice {
  constructor(
    @InjectRepository(Store)
    private readonly stores: Repository<Store>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    private readonly categories: CategoryRepository,
  ) {}

  client = algoliasearch(process.env.ALGOLIA_KEY, process.env.ALGOLIA_SECRET);
  index = this.client.initIndex(process.env.ALGOLIA_INDEX);

  async createStore(
    owner: User,
    createStoreInput: CreateStoreInput,
  ): Promise<CreateStoreOutput> {
    try {
      const newStore = this.stores.create(createStoreInput);
      newStore.owner = owner;
      newStore._geoloc = owner._geoloc;
      // const category = await this.categories.getOrCreate(
      //   createStoreInput.categoryName,
      // );
      // newStore.category = category;
      await this.stores.save(newStore);
      return {
        ok: true,
        storeId: newStore.id,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create store',
      };
    }
  }

  async editStore(
    owner: User,
    editStoreInput: EditStoreInput,
  ): Promise<EditStoreOutput> {
    try {
      const store = await this.stores.findOne(editStoreInput.storeId);
      if (!store) {
        return {
          ok: false,
          error: 'Store not found',
        };
      }
      if (owner.id !== store.ownerId) {
        return {
          ok: false,
          error: "You can't edit a store that you don't own",
        };
      }
      // let category: Category = null;
      // if (editStoreInput.categoryName) {
      //   category = await this.categories.getOrCreate(
      //     editStoreInput.categoryName,
      //   );
      // }
      await this.stores.save([
        {
          id: editStoreInput.storeId,
          ...editStoreInput,
          // ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit Store',
      };
    }
  }

  async deleteStore(
    owner: User,
    { storeId }: DeleteStoreInput,
  ): Promise<DeleteStoreOutput> {
    try {
      const store = await this.stores.findOne(storeId);
      if (!store) {
        return {
          ok: false,
          error: 'Store not found',
        };
      }
      if (owner.id !== store.ownerId) {
        return {
          ok: false,
          error: "You can't delete a store that you don't own",
        };
      }
      await this.stores.delete(storeId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete store.',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }

  countProducts(category: Category) {
    return this.products.count({ category });
  }
  async findCategoryBySlug(
    { slug, page }: CategoryInput,
    user: User,
  ): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      let products;
      if (user.role === UserRole.Client) {
        products = await this.products.find({
          take: 25,
          skip: (page - 1) * 25,
          relations: ['store'],
          where: {
            productRole: UserRole.Retailer,
            category,
          },
        });
      } else if (user.role === UserRole.Retailer) {
        products = await this.products.find({
          take: 25,
          skip: (page - 1) * 25,
          relations: ['store'],
          where: {
            productRole: UserRole.Owner,
            category,
          },
        });
      }
      const totalResults = products.length;
      return {
        ok: true,
        products,
        category,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load category',
      };
    }
  }

  async allStores({ page }: StoresInput): Promise<StoresOutput> {
    try {
      const [stores, totalResults] = await this.stores.findAndCount({
        skip: (page - 1) * 3,
        take: 3,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results: stores,
        totalPages: Math.ceil(totalResults / 3),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load stores',
      };
    }
  }

  async findStoreById({ storeId }: StoreInput): Promise<StoreOutput> {
    try {
      const store = await this.stores.findOne(storeId, {
        relations: ['menu'],
      });
      if (!store) {
        return {
          ok: false,
          error: 'Store not found',
        };
      }
      return {
        ok: true,
        store,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find store',
      };
    }
  }

  async searchStoreByName({
    query,
    page,
  }: SearchStoreInput): Promise<SearchStoreOutput> {
    try {
      const [stores, totalResults] = await this.stores.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * 25,
        take: 25,
      });
      return {
        ok: true,
        stores,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return { ok: false, error: 'Could not search for stores' };
    }
  }

  async createProduct(
    owner: User,
    createProductInput: CreateProductInput,
  ): Promise<CreateProductOutput> {
    try {
      const store = await this.stores.findOne(createProductInput.storeId);
      if (!store) {
        return {
          ok: false,
          error: 'Store not found',
        };
      }

      if (owner.id !== store.ownerId) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }
      const newProduct = await this.products.create({
        ...createProductInput,
        store,
      });

      newProduct._geoloc = store._geoloc;
      newProduct.productRole = store.owner.role;

      const category = await this.categories.getOrCreate(
        createProductInput.categoryName,
      );
      newProduct.category = category;

      await this.products.save(newProduct);

      //Algolia
      this.index.saveObject(newProduct, {
        autoGenerateObjectIDIfNotExist: true,
      });

      return {
        ok: true,
        productId: newProduct.id,
      };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        error: 'Could not create product',
      };
    }
  }

  async checkProductOwner(ownerId: number, productId: number) {}

  async editProduct(
    owner: User,
    editProductInput: EditProductInput,
  ): Promise<EditProductOutput> {
    try {
      const product = await this.products.findOne(editProductInput.productId, {
        relations: ['store', 'category'],
      });
      if (!product) {
        return {
          ok: false,
          error: 'Product not found',
        };
      }
      if (product.store.ownerId !== owner.id) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }
      let category: Category = null;
      if (editProductInput.categoryName) {
        category = await this.categories.getOrCreate(
          editProductInput.categoryName,
        );
      }
      await this.products.save([
        {
          id: editProductInput.productId,
          ...editProductInput,
          ...(category && { category }),
        },
      ]);
      //Algolia
      await this.index.deleteBy({
        filters: `id:${editProductInput.productId}`,
      });

      const afterEditProduct = await this.products.findOne(
        editProductInput.productId,
        {
          relations: ['store', 'category'],
        },
      );

      await this.index.saveObject(afterEditProduct, {
        autoGenerateObjectIDIfNotExist: true,
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete product',
      };
    }
  }

  async deleteProduct(
    owner: User,
    { productId }: DeleteProductInput,
  ): Promise<DeleteProductOutput> {
    try {
      const product = await this.products.findOne(productId, {
        relations: ['store'],
      });
      if (!product) {
        return {
          ok: false,
          error: 'Product not found',
        };
      }
      if (product.store.ownerId !== owner.id) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }
      await this.products.delete(productId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete product',
      };
    }
  }

  async searchProductByName(
    { query, page }: SearchProductInput,
    user: User,
  ): Promise<SearchProductOutput> {
    try {
      let products, totalResults;
      if (user.role === UserRole.Client) {
        [products, totalResults] = await this.products.findAndCount({
          where: {
            productRole: UserRole.Retailer,
            name: Raw(name => `${name} ILIKE '%${query}%'`),
          },
          relations: ['store'],
          skip: (page - 1) * 25,
          take: 25,
        });
      } else if (user.role === UserRole.Retailer) {
        [products, totalResults] = await this.products.findAndCount({
          where: {
            productRole: UserRole.Owner,
            name: Raw(name => `${name} ILIKE '%${query}%'`),
          },
          relations: ['store'],
          skip: (page - 1) * 25,
          take: 25,
        });
      }

      // //Demo code for filtering through location
      // const blabla = this.index.search('7').then(({ hits }) => {
      //   return hits;
      // });
      // let cast = Promise.resolve(blabla);

      // cast.then((_) => {
      //   return _;
      // });
      // console.log(cast);
      // //console.log(Object.keys(blabla).length);

      return {
        ok: true,
        products,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return { ok: false, error: 'Could not search for products' };
    }
  }

  async myStores(owner: User): Promise<MyStoresOutput> {
    try {
      const stores = await this.stores.find({ owner });
      return {
        stores,
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find stores.',
      };
    }
  }
  async myStore(owner: User, { id }: MyStoreInput): Promise<MyStoreOutput> {
    try {
      const store = await this.stores.findOne(
        { owner, id },
        { relations: ['menu', 'orders'] },
      );
      return {
        store,
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find store',
      };
    }
  }

  async findProductById({ productId }: ProductInput): Promise<ProductOutput> {
    try {
      const product = await this.products.findOne(productId, {
        relations: ['store'],
      });
      if (!product) {
        return {
          ok: false,
          error: 'Product not found',
        };
      }
      return {
        ok: true,
        product,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find product',
      };
    }
  }

  async allProducts(
    { page }: ProductsInput,
    user: User,
  ): Promise<ProductsOutput> {
    try {
      let products, totalResults;
      if (user.role === UserRole.Retailer) {
        [products, totalResults] = await this.products.findAndCount({
          skip: (page - 1) * 3,
          take: 3,
          relations: ['store'],
          where: {
            productRole: UserRole.Owner,
          },
        });
      } else if (user.role === UserRole.Client) {
        [products, totalResults] = await this.products.findAndCount({
          skip: (page - 1) * 3,
          take: 3,
          relations: ['store'],
          where: {
            productRole: UserRole.Retailer,
          },
        });
      }
      return {
        ok: true,
        results: products,
        totalPages: Math.ceil(totalResults / 3),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load products',
      };
    }
  }

  // FILTERING

  //URL for calculating dist according to radius
  //http://www.movable-type.co.uk/scripts/latlong.html
  calculateDistance(lat1, lon1, lat2, lon2) {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var radlon1 = (Math.PI * lon1) / 180;
    var radlon2 = (Math.PI * lon2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344;
    return dist;
  }

  async filterProductByName(
    { radiusInKm, page }: FilterProductInput,
    user: User,
  ): Promise<FilterProductOutput> {
    try {
      let productsByProductRole, totalResults;
      let products = [];
      if (user.role === UserRole.Client) {
        [
          productsByProductRole,
          totalResults,
        ] = await this.products.findAndCount({
          where: {
            productRole: UserRole.Retailer,
          },
          relations: ['store'],
          skip: (page - 1) * 25,
          take: 25,
        });
      } else if (user.role === UserRole.Retailer) {
        [
          productsByProductRole,
          totalResults,
        ] = await this.products.findAndCount({
          where: {
            productRole: UserRole.Owner,
          },
          relations: ['store'],
          skip: (page - 1) * 25,
          take: 25,
        });
      }
      productsByProductRole.forEach(product => {
        const lat1 = user._geoloc.lat;
        const lng1 = user._geoloc.lng;
        const lat2 = product._geoloc.lat;
        const lng2 = product._geoloc.lng;
        const dist = this.calculateDistance(lat1, lng1, lat2, lng2);
        const km = Number(radiusInKm);
        console.log(dist, '<------THIS IS THE KM');
        if (dist <= km) {
          products.push(product);
          totalResults -= 1;
        }
      });
      return {
        ok: true,
        products,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return { ok: false, error: 'Could not search for products' };
    }
  }
}
