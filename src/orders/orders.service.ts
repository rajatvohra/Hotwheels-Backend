import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import algoliasearch from 'algoliasearch';
import { PubSub } from 'graphql-subscriptions';
import {
  NEW_PACKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { MailService } from 'src/mail/mail.service';
import { Product } from 'src/stores/entities/product.entity';
import { Store } from 'src/stores/entities/store.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateOrderInput,
  CreateOrderOfflineInput,
  CreateOrderOfflineOutput,
  CreateOrderOutput,
} from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { Order, OrderMode, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Store)
    private readonly stores: Repository<Store>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly mailService: MailService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  client = algoliasearch(process.env.ALGOLIA_KEY, process.env.ALGOLIA_SECRET);
  index = this.client.initIndex(process.env.ALGOLIA_INDEX);

  async createOrder(
    customer: User,
    { storeId, productId, quantity }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const store = await this.stores.findOne(storeId);
      if (!store) {
        return {
          ok: false,
          error: 'Store not found',
        };
      }

      const product = await this.products.findOne(productId);
      if (product.stocks < quantity) {
        return {
          ok: false,
          error: 'Product Quantity Not Available.',
        };
      }

      let orderFinalPrice = 0;

      if (!product) {
        return {
          ok: false,
          error: 'Product not found.',
        };
      }

      let productFinalPrice = product.price * quantity;

      product.stocks -= quantity;
      await this.products.save(product);

      // await this.index.deleteBy({
      //   filters: `id:${product.id}`,
      // });

      // await this.index.saveObject(product, {
      //   autoGenerateObjectIDIfNotExist: true,
      // });

      orderFinalPrice = orderFinalPrice + productFinalPrice;
      const order = await this.orders.save(
        this.orders.create({
          customer,
          store,
          total: orderFinalPrice,
          product,
          quantity,
        }),
      );
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: store.ownerId },
      });
      return {
        ok: true,
        orderId: order.id,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not create order.',
      };
    }
  }

  //* Create Order Offline Method

  async createOrderOffline(
    customer: User,
    { storeId, productId, quantity }: CreateOrderOfflineInput,
  ): Promise<CreateOrderOfflineOutput> {
    try {
      const store = await this.stores.findOne(storeId);
      if (!store) {
        return {
          ok: false,
          error: 'Store not found',
        };
      }

      const product = await this.products.findOne(productId);
      if (product.stocks < quantity) {
        return {
          ok: false,
          error: 'Product Quantity Not Available.',
        };
      }

      let orderFinalPrice = 0;

      if (!product) {
        return {
          ok: false,
          error: 'Product not found.',
        };
      }

      let productFinalPrice = product.price * quantity;

      product.stocks -= quantity;
      await this.products.save(product);

      // await this.index.deleteBy({
      //   filters: `id:${product.id}`,
      // });

      // await this.index.saveObject(product, {
      //   autoGenerateObjectIDIfNotExist: true,
      // });

      orderFinalPrice = orderFinalPrice + productFinalPrice;
      const order = await this.orders.save(
        this.orders.create({
          customer,
          store,
          total: orderFinalPrice,
          product,
          quantity,
          mode: OrderMode.Offline,
        }),
      );
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: store.ownerId },
      });
      return {
        ok: true,
        orderId: order.id,
      };
    } catch (e) {
      console.log(e);
      return {
        ok: false,
        error: 'Could not create order.',
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const stores = await this.stores.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        orders = stores.map(store => store.orders).flat(1);
        if (status) {
          orders = orders.filter(order => order.status === status);
        }
      } else if (user.role === UserRole.Retailer) {
        const stores = await this.stores.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
        let brands = stores.map(store => store.orders).flat(1);
        if (status) {
          brands = brands.filter(order => order.status === status);
        }
        orders = orders.concat(brands);
      }
      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not get orders',
      };
    }
  }

  canSeeOrder(user: User, order: Order): boolean {
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Owner && order.store.ownerId !== user.id) {
      canSee = false;
    }
    if (
      user.role === UserRole.Retailer &&
      order.customerId !== user.id &&
      order.store.ownerId !== user.id
    ) {
      canSee = false;
    }
    return canSee;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['store'],
      });

      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }

      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: 'You cant see that',
        };
      }
      return {
        ok: true,
        order,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load order.',
      };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "Can't see this.",
        };
      }
      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      //TBC
      if (user.role === UserRole.Retailer) {
        if (order.customerId === user.id) {
          canEdit = false;
        } else if (order.store.ownerId === user.id) {
          if (status !== OrderStatus.Packing && status !== OrderStatus.Packed) {
            canEdit = false;
          }
        }
      }

      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Packing && status !== OrderStatus.Packed) {
          canEdit = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }
      await this.orders.save({
        id: orderId,
        status,
      });
      const newOrder = { ...order, status };

      //TBC
      if (user.role === UserRole.Owner || user.role === UserRole.Retailer) {
        if (status === OrderStatus.Packed) {
          await this.pubSub.publish(NEW_PACKED_ORDER, {
            packedOrders: newOrder,
          });
        }
      }
      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });

      // refactor template to send full order details of the order in the delivery mail

      const orderStatusForEmail = await this.orders.findOne(orderId);
      if (orderStatusForEmail.status === 'Delivered') {
        const custEmail = await this.users.findOne(order.customerId);
        this.mailService.sendDeliveryEmail(custEmail.email);
        this.mailService.sendFeedbackEmail(custEmail.email);
      }

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit order.',
      };
    }
  }

  //* Edit Orders Offline

  async editOrderOffline(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "Can't see this.",
        };
      }
      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      //TBC
      if (user.role === UserRole.Retailer) {
        if (order.customerId === user.id) {
          canEdit = false;
        } else if (order.store.ownerId === user.id) {
          if (
            status !== OrderStatus.Packing &&
            status !== OrderStatus.Packed &&
            status !== OrderStatus.Delivered
          ) {
            canEdit = false;
          }
        }
      }

      if (user.role === UserRole.Owner) {
        if (
          status !== OrderStatus.Packing &&
          status !== OrderStatus.Packed &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }
      await this.orders.save({
        id: orderId,
        status,
      });
      const newOrder = { ...order, status };

      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });

      //refactor template to send full order details of the order in the delivery mail

      const orderStatusForEmail = await this.orders.findOne(orderId);
      if (orderStatusForEmail.status === 'Packed') {
        const custEmail = await this.users.findOne(order.customerId);
        this.mailService.sendPackedEmail(custEmail.email);
      }

      if (orderStatusForEmail.status === 'Delivered') {
        const custEmail = await this.users.findOne(order.customerId);
        this.mailService.sendDeliveryEmail(custEmail.email);
        this.mailService.sendFeedbackEmail(custEmail.email);
      }

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit order.',
      };
    }
  }

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: 'This order already has a driver',
        };
      }
      if (order.mode === OrderMode.Offline) {
        return {
          ok: false,
          error: 'You are not allowed to deliver Offline mode Order.',
        };
      }
      await this.orders.save({
        id: orderId,
        driver,
      });
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not update order.',
      };
    }
  }
}
