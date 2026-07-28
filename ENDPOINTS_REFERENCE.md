# Fooddely API Endpoints Quick Reference

This document provides a quick reference for all implemented API endpoints.

## Endpoint Status Summary

| Endpoint                            | Method | Auth     | Status     | Hook                       |
| ----------------------------------- | ------ | -------- | ---------- | -------------------------- |
| `/api/app/restaurants/`             | GET    | No       | ✅         | `useRestaurants()`         |
| `/api/app/restaurants/{id}/`        | GET    | No       | ✅         | `useRestaurantDetail(id)`  |
| `/api/app/restaurant_categories/`   | GET    | No       | ✅         | `useCategories()`          |
| `/api/app/customer/`                | GET    | JWT      | ✅         | `useCustomerProfile()`     |
| `/api/app/customer/register/`       | POST   | No       | ✅         | `useRegisterCustomer()`    |
| `/api/app/customer/login/`          | POST   | No       | ✅         | `useLogin()`               |
| `/api/app/cart/`                    | GET    | Optional | ✅         | `useCart()`                |
| `/api/app/cart/`                    | POST   | Optional | ✅         | `useAddToCart()`           |
| `/api/app/cart/`                    | DELETE | Optional | ✅         | `useRemoveFromCart()`      |
| `/api/app/orders/`                  | GET    | Optional | ✅ **NEW** | `useOrders()`              |
| `/api/app/orders/{id}/`             | GET    | Optional | ✅ **NEW** | `useOrderDetail(id)`       |
| `/api/app/orders/{id}/status/`      | GET    | Optional | ✅ **NEW** | `useOrderStatus(id)`       |
| `/api/app/cart/submit/`             | POST   | Optional | ✅ **NEW** | `useSubmitCart()`          |
| `/api/app/orders/{id}/cancel/`      | POST   | Optional | ✅ **NEW** | `useCancelOrder()`         |
| `/api/app/payment/intent/`          | POST   | Optional | ✅ **NEW** | `useCreatePaymentIntent()` |
| `/api/app/payment/confirm/`         | POST   | Optional | ✅ **NEW** | `useConfirmPayment()`      |
| `/api/app/customer/addresses/`      | GET    | JWT      | ✅ **NEW** | `useAddresses()`           |
| `/api/app/customer/addresses/`      | POST   | JWT      | ✅ **NEW** | `useCreateAddress()`       |
| `/api/app/customer/addresses/{id}/` | DELETE | JWT      | ✅ **NEW** | `useDeleteAddress()`       |

## Request/Response Formats

### Restaurants

#### GET `/api/app/restaurants/`

**Query Params:**

- `search` (string, optional)
- `category` (number, optional)

**Response:**

```typescript
RestaurantListItem[]
```

### Cart

#### POST `/api/app/cart/`

**Request (FormData):**

```json
{
  "quantity": 2,
  "menu_item": 123,
  "options": [{ "option": 3, "item": 12 }]
}
```

**OR for NoWaste items:**

```json
{
  "quantity": 1,
  "nowaste_item": 55
}
```

**Response:**

```typescript
{
  id: number;
  customer: number | null;
  session_id: string | null;
  items: CartItemResponse[];
  total_price: string;
}
```

### Orders

#### POST `/api/app/cart/submit/`

**Request (FormData):**

```json
{
  "delivery_firstname": "John",
  "delivery_lastname": "Doe",
  "delivery_address": "123 Main St",
  "delivery_postal_code": "75000",
  "delivery_city": "Paris",
  "delivery_phone": "+33123456789",
  "delivery_email": "john@example.com"
}
```

#### POST `/api/app/orders/{id}/cancel/`

**Request (JSON):**

```json
{
  "reason": "Changed my mind"
}
```

### Payment

#### POST `/api/app/payment/intent/`

**Request (FormData, optional delivery info):**

```json
{
  "delivery_firstname": "John",
  "delivery_lastname": "Doe",
  "delivery_address": "123 Main St",
  "delivery_postal_code": "75000",
  "delivery_city": "Paris",
  "delivery_phone": "+33123456789",
  "delivery_email": "john@example.com"
}
```

**Response:**

```typescript
{
  client_secret: string;
  cart_id: number;
  total_price: string;
}
```

#### POST `/api/app/payment/confirm/`

**Request (JSON):**

```json
{
  "payment_intent_id": "pi_1234567890"
}
```

### Addresses

#### POST `/api/app/customer/addresses/`

**Request (FormData):**

```json
{
  "address": "123 Main St",
  "postal_code": "75000",
  "city": "Paris",
  "default": true
}
```

## Import Paths

All hooks and types can be imported from:

```typescript
import {
  // Hooks
  useRestaurants,
  useRestaurantDetail,
  useCategories,
  useCustomerProfile,
  useRegisterCustomer,
  useLogin,
  useCart,
  useAddToCart,
  useRemoveFromCart,
  useAddMenuItemToCart,
  useAddNoWasteItemToCart,
  useOrders,
  useOrderDetail,
  useOrderStatus,
  useSubmitCart,
  useCancelOrder,
  useCreatePaymentIntent,
  useConfirmPayment,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,

  // Types
  RestaurantListItem,
  RestaurantDetailResponse,
  CustomerProfile,
  CartResponse,
  OrderListItem,
  OrderDetailResponse,
  PaymentIntentResponse,
  CustomerAddress,
  // ... and more
} from "@/lib/api";
```

## Common Patterns

### Authentication

```typescript
import { setAuthToken, clearAuthToken } from "@/lib/api/client";

// After login
setAuthToken(token);

// On logout
clearAuthToken();
```

### Error Handling

```typescript
const { mutate, error } = useAddToCart();

mutate(data, {
  onError: (error) => {
    console.error("Error:", error.response?.data);
  },
});
```

### Polling Order Status

```typescript
const { data: status } = useOrderStatus(orderId, true, 5000); // Poll every 5s
```
