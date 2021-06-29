# Hotwheels

The Backend of Hotwheels

## User Model

- id
- created at
- updated at
- email
- password
- role(client|owner|delivery)

## User CRUD

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

## Store Model

- name
- category
- address
- coverImage
- Edit Store
- Delete Store
- See Categories
- See Stores by Category (pagination)
- See Stores (pagination)
- See Store

## Products CRUD

- Create Product
- Edit Product
- Delete Product

## Orders CRUD

- Orders CRUD
- Orders Subscription (Owner, Customer, Delivery)
  - Pending Orders (Owner) (S: newOrder) (T: createOrder(newOrder))
  - Order Status (Customer, Delivery, Owner) (S: orderUpdate) (T: editOrder(orderUpdate))
  - Pending Pickup Order (Delivery) (S: orderUpdate) (T: editOrder(orderUpdate))
- Add Driver to Order

## Payments

- Payments(CRON)
