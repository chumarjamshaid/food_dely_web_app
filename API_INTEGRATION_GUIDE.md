# Fooddely API Integration Guide

This document provides a comprehensive guide to the Fooddely REST API integration in this Next.js application, including all implemented endpoints, changes made, and testing instructions.

## Table of Contents

1. [Overview](#overview)
2. [Implemented Endpoints](#implemented-endpoints)
3. [API Client Configuration](#api-client-configuration)
4. [Usage Examples](#usage-examples)
5. [Testing Guide](#testing-guide)
6. [Error Handling](#error-handling)

## Overview

This application integrates with the Fooddely REST API backend. All API interactions are handled through React Query hooks for efficient data fetching, caching, and state management.

### Base URL Configuration

The API base URL is configured in `src/lib/api/client.ts`:

```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend.fooddely.com";
```

Set the `NEXT_PUBLIC_API_URL` environment variable to point to your backend server.

## Implemented Endpoints

### ✅ 1. Restaurants Endpoints

#### GET `/api/app/restaurants/`

- **Hook**: `useRestaurants(params?)`
- **File**: `src/lib/api/hooks/use-restaurants.ts`
- **Description**: List restaurants with optional search and category filters
- **Auth**: Not required
- **Query Parameters**:
  - `search` (string, optional): Filter by restaurant name
  - `category` (number, optional): Filter by category ID

#### GET `/api/app/restaurants/{id}/`

- **Hook**: `useRestaurantDetail(id)`
- **File**: `src/lib/api/hooks/use-restaurants.ts`
- **Description**: Get full restaurant details including menu
- **Auth**: Not required

### ✅ 2. Restaurant Categories Endpoints

#### GET `/api/app/restaurant_categories/`

- **Hook**: `useCategories()`
- **File**: `src/lib/api/hooks/use-categories.ts`
- **Description**: List all restaurant categories
- **Auth**: Not required

### ✅ 3. Customer Authentication Endpoints

#### GET `/api/app/customer/`

- **Hook**: `useCustomerProfile(enabled?)`
- **File**: `src/lib/api/hooks/use-customer.ts`
- **Description**: Get authenticated customer profile
- **Auth**: JWT required

#### POST `/api/app/customer/register/`

- **Hook**: `useRegisterCustomer()`
- **File**: `src/lib/api/hooks/use-customer.ts`
- **Description**: Register a new customer account
- **Auth**: Not required
- **Request Format**: multipart/form-data with JSON in `data` field

#### POST `/api/app/customer/login/`

- **Hook**: `useLogin()`
- **File**: `src/lib/api/hooks/use-customer.ts`
- **Description**: Login customer and receive JWT token
- **Auth**: Not required
- **Note**: Adjust endpoint based on your backend implementation

### ✅ 4. Cart Management Endpoints

#### GET `/api/app/cart/`

- **Hook**: `useCart()`
- **File**: `src/lib/api/hooks/use-cart.ts`
- **Description**: Get current cart (works for authenticated and anonymous users)
- **Auth**: Optional (JWT for authenticated users, session for anonymous)

#### POST `/api/app/cart/`

- **Hook**: `useAddToCart()`, `useAddMenuItemToCart()`, `useAddNoWasteItemToCart()`
- **File**: `src/lib/api/hooks/use-cart.ts`
- **Description**: Add item to cart (menu item or NoWaste item)
- **Auth**: Optional
- **Request Format**: multipart/form-data with JSON in `data` field

#### DELETE `/api/app/cart/`

- **Hook**: `useRemoveFromCart()`
- **File**: `src/lib/api/hooks/use-cart.ts`
- **Description**: Remove item from cart
- **Auth**: Optional
- **Request Format**: multipart/form-data with `cart_item` field

### ✅ 5. Order Endpoints (NEW)

#### GET `/api/app/orders/`

- **Hook**: `useOrders()`
- **File**: `src/lib/api/hooks/use-orders.ts`
- **Description**: Get all orders for current user/session
- **Auth**: Optional (JWT for authenticated, session for anonymous)

#### GET `/api/app/orders/{id}/`

- **Hook**: `useOrderDetail(id)`
- **File**: `src/lib/api/hooks/use-orders.ts`
- **Description**: Get full order details
- **Auth**: Optional

#### GET `/api/app/orders/{id}/status/`

- **Hook**: `useOrderStatus(id, enabled?, refetchInterval?)`
- **File**: `src/lib/api/hooks/use-orders.ts`
- **Description**: Get order status only (lightweight for polling)
- **Auth**: Optional
- **Usage**: Useful for real-time status updates with polling

#### POST `/api/app/cart/submit/`

- **Hook**: `useSubmitCart()`
- **File**: `src/lib/api/hooks/use-orders.ts`
- **Description**: Convert cart to order (without payment)
- **Auth**: Optional
- **Request Format**: multipart/form-data with delivery info in `data` field

#### POST `/api/app/orders/{id}/cancel/`

- **Hook**: `useCancelOrder()`
- **File**: `src/lib/api/hooks/use-orders.ts`
- **Description**: Cancel an order (only if status is PLACED or PREPARING)
- **Auth**: Optional
- **Request Format**: JSON with `reason` field

### ✅ 6. Payment Endpoints (NEW)

#### POST `/api/app/payment/intent/`

- **Hook**: `useCreatePaymentIntent()`
- **File**: `src/lib/api/hooks/use-payment.ts`
- **Description**: Create Stripe PaymentIntent for current cart
- **Auth**: Optional
- **Request Format**: multipart/form-data with optional delivery info in `data` field
- **Response**: Returns Stripe `client_secret` for client-side payment confirmation

#### POST `/api/app/payment/confirm/`

- **Hook**: `useConfirmPayment()`
- **File**: `src/lib/api/hooks/use-payment.ts`
- **Description**: Confirm Stripe payment and create order
- **Auth**: Optional
- **Request Format**: JSON with `payment_intent_id`
- **Response**: Returns finalized paid order

### ✅ 7. Customer Addresses Endpoints (NEW)

#### GET `/api/app/customer/addresses/`

- **Hook**: `useAddresses(enabled?)`
- **File**: `src/lib/api/hooks/use-addresses.ts`
- **Description**: Get all saved addresses for authenticated customer
- **Auth**: JWT required

#### POST `/api/app/customer/addresses/`

- **Hook**: `useCreateAddress()`
- **File**: `src/lib/api/hooks/use-addresses.ts`
- **Description**: Create a new delivery address
- **Auth**: JWT required
- **Request Format**: multipart/form-data with address data in `data` field
- **Note**: If `default: true`, all other addresses are set to `default: false`

#### DELETE `/api/app/customer/addresses/{id}/`

- **Hook**: `useDeleteAddress()`
- **File**: `src/lib/api/hooks/use-addresses.ts`
- **Description**: Delete a delivery address
- **Auth**: JWT required
- **Note**: Customer must always have at least one address

## API Client Configuration

The API client (`src/lib/api/client.ts`) is configured with:

- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL` environment variable
- **Credentials**: `withCredentials: true` for session-based cart support
- **JWT Authentication**: Automatically adds `Authorization: Bearer <token>` header from localStorage
- **Error Handling**: Automatically clears token on 401 errors

### Authentication Helpers

```typescript
import { setAuthToken, clearAuthToken, hasAuthToken } from "@/lib/api/client";

// Set token after login
setAuthToken(token);

// Clear token on logout
clearAuthToken();

// Check if user is authenticated
const isAuthenticated = hasAuthToken();
```

## Usage Examples

### Fetching Restaurants

```typescript
import { useRestaurants } from "@/lib/api";

function RestaurantList() {
  const {
    data: restaurants,
    isLoading,
    error,
  } = useRestaurants({
    search: "pizza",
    category: 1,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {restaurants?.map((restaurant) => (
        <div key={restaurant.id}>{restaurant.name}</div>
      ))}
    </div>
  );
}
```

### Adding to Cart

```typescript
import { useAddMenuItemToCart } from "@/lib/api";

function MenuItem({ itemId }) {
  const { mutate: addToCart, isPending } = useAddMenuItemToCart();

  const handleAdd = () => {
    addToCart({
      quantity: 2,
      menu_item: itemId,
      options: [
        { option: 3, item: 12 }, // option group id, option item id
      ],
    });
  };

  return (
    <button onClick={handleAdd} disabled={isPending}>
      Add to Cart
    </button>
  );
}
```

### Creating Payment Intent

```typescript
import { useCreatePaymentIntent } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";

function Checkout() {
  const { mutate: createIntent, data: intentData } = useCreatePaymentIntent();

  const handlePayment = async () => {
    // Create payment intent
    createIntent(
      {
        delivery_firstname: "John",
        delivery_lastname: "Doe",
        delivery_address: "123 Main St",
        delivery_postal_code: "75000",
        delivery_city: "Paris",
        delivery_phone: "+33123456789",
        delivery_email: "john@example.com",
      },
      {
        onSuccess: async (data) => {
          // Initialize Stripe
          const stripe = await loadStripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
          );

          // Confirm payment on client
          const result = await stripe?.confirmCardPayment(data.client_secret, {
            payment_method: {
              card: cardElement,
            },
          });

          if (result?.error) {
            console.error(result.error);
          } else {
            // Confirm payment on backend
            confirmPayment({ payment_intent_id: result.paymentIntent.id });
          }
        },
      }
    );
  };
}
```

### Polling Order Status

```typescript
import { useOrderStatus } from "@/lib/api";

function OrderTracker({ orderId }) {
  // Poll every 5 seconds
  const { data: status } = useOrderStatus(orderId, true, 5000);

  return (
    <div>
      <p>Status: {status?.status}</p>
      <p>Last updated: {status?.updated_at}</p>
    </div>
  );
}
```

### Managing Addresses

```typescript
import { useAddresses, useCreateAddress, useDeleteAddress } from "@/lib/api";

function AddressManager() {
  const { data: addresses } = useAddresses();
  const { mutate: createAddress } = useCreateAddress();
  const { mutate: deleteAddress } = useDeleteAddress();

  const handleCreate = () => {
    createAddress({
      address: "123 Main St",
      postal_code: "75000",
      city: "Paris",
      default: true,
    });
  };

  const handleDelete = (id: number) => {
    deleteAddress(id);
  };

  return (
    <div>
      {addresses?.map((addr) => (
        <div key={addr.id}>
          <p>
            {addr.address}, {addr.city}
          </p>
          {addr.default && <span>Default</span>}
          <button onClick={() => handleDelete(addr.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Testing Guide

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Manual Testing with Browser DevTools

#### Test Restaurant Endpoints

1. Open browser DevTools → Network tab
2. Navigate to a page using `useRestaurants()`
3. Verify request to `GET /api/app/restaurants/`
4. Check response format matches `RestaurantListItem[]`

#### Test Cart Endpoints

1. Add item to cart using `useAddToCart()`
2. Verify request to `POST /api/app/cart/` with FormData
3. Check response contains updated cart
4. Remove item and verify `DELETE /api/app/cart/` request

#### Test Authentication

1. Register user with `useRegisterCustomer()`
2. Login with `useLogin()` (adjust endpoint if needed)
3. Verify token is stored in localStorage
4. Fetch profile with `useCustomerProfile()`
5. Verify `Authorization: Bearer <token>` header in request

### 3. Testing with cURL

#### Test Restaurant List

```bash
curl -X GET "https://your-backend-domain.com/api/app/restaurants/?search=pizza" \
  -H "Content-Type: application/json"
```

#### Test Cart (Anonymous)

```bash
# Get cart
curl -X GET "https://your-backend-domain.com/api/app/cart/" \
  -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt

# Add to cart
curl -X POST "https://your-backend-domain.com/api/app/cart/" \
  -H "Content-Type: multipart/form-data" \
  -F "data={\"quantity\":2,\"menu_item\":{\"id\":123}}" \
  -b cookies.txt -c cookies.txt
```

#### Test Customer Registration

```bash
curl -X POST "https://your-backend-domain.com/api/app/customer/register/" \
  -H "Content-Type: multipart/form-data" \
  -F "data={\"firstname\":\"John\",\"lastname\":\"Doe\",\"birthday\":\"1995-04-12\",\"address\":\"10 Main St\",\"postal_code\":\"75000\",\"city\":\"Paris\",\"email\":\"john@example.com\",\"phone\":\"+33123456789\",\"password\":\"mypassword\",\"password_confirm\":\"mypassword\"}"
```

#### Test Orders (with JWT)

```bash
# Get orders
curl -X GET "https://your-backend-domain.com/api/app/orders/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get order detail
curl -X GET "https://your-backend-domain.com/api/app/orders/12/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Cancel order
curl -X POST "https://your-backend-domain.com/api/app/orders/12/cancel/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Changed my mind"}'
```

#### Test Payment Intent

```bash
curl -X POST "https://your-backend-domain.com/api/app/payment/intent/" \
  -H "Content-Type: multipart/form-data" \
  -F "data={\"delivery_firstname\":\"John\",\"delivery_lastname\":\"Doe\",\"delivery_address\":\"123 Main St\",\"delivery_postal_code\":\"75000\",\"delivery_city\":\"Paris\",\"delivery_phone\":\"+33123456789\",\"delivery_email\":\"john@example.com\"}" \
  -b cookies.txt -c cookies.txt
```

#### Test Addresses (with JWT)

```bash
# Get addresses
curl -X GET "https://your-backend-domain.com/api/app/customer/addresses/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Create address
curl -X POST "https://your-backend-domain.com/api/app/customer/addresses/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "data={\"address\":\"123 Main St\",\"postal_code\":\"75000\",\"city\":\"Paris\",\"default\":true}"

# Delete address
curl -X DELETE "https://your-backend-domain.com/api/app/customer/addresses/5/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Testing with Postman

1. **Import Collection**: Create a Postman collection with all endpoints
2. **Set Environment Variables**:
   - `base_url`: Your backend URL
   - `jwt_token`: JWT token for authenticated requests
3. **Test Each Endpoint**:
   - Verify request format (multipart/form-data vs JSON)
   - Check response status codes
   - Validate response structure matches TypeScript types

### 5. Integration Testing Checklist

- [ ] Restaurant list with filters (search, category)
- [ ] Restaurant detail with menu items
- [ ] Category list
- [ ] Customer registration
- [ ] Customer login (if implemented)
- [ ] Customer profile fetch (with JWT)
- [ ] Add menu item to cart (authenticated)
- [ ] Add menu item to cart (anonymous)
- [ ] Add NoWaste item to cart
- [ ] Remove item from cart
- [ ] Get cart (authenticated)
- [ ] Get cart (anonymous)
- [ ] Submit cart to order
- [ ] Get orders list
- [ ] Get order detail
- [ ] Poll order status
- [ ] Cancel order (PLACED status)
- [ ] Cancel order (PREPARING status)
- [ ] Create payment intent
- [ ] Confirm payment
- [ ] Get addresses (authenticated)
- [ ] Create address
- [ ] Delete address (with multiple addresses)
- [ ] Delete address (last address - should fail)

## Error Handling

All hooks use React Query's error handling. Common error scenarios:

### 401 Unauthorized

- Automatically clears auth token
- Can redirect to login page (uncomment in `client.ts`)

### 404 Not Found

- Handled gracefully in hooks
- No retry on 404 errors

### Validation Errors

- Backend returns error messages in response
- Access via `error.response.data` in mutation callbacks

### Example Error Handling

```typescript
const { mutate, error, isError } = useAddToCart();

mutate(cartData, {
  onError: (error) => {
    if (error.response?.status === 400) {
      console.error("Validation error:", error.response.data);
    } else if (error.response?.status === 404) {
      console.error("Cart not found");
    }
  },
});
```

## Summary of Changes

### New Files Created

1. `src/lib/api/hooks/use-orders.ts` - Order management hooks
2. `src/lib/api/hooks/use-payment.ts` - Payment processing hooks
3. `src/lib/api/hooks/use-addresses.ts` - Address management hooks

### Files Modified

1. `src/lib/api/types.ts` - Added types for orders, payment, and addresses
2. `src/lib/api/hooks/index.ts` - Exported new hooks
3. `src/lib/api/index.ts` - Exported new types

### Endpoints Status

| Endpoint                                 | Status         | Hook                     | Notes |
| ---------------------------------------- | -------------- | ------------------------ | ----- |
| GET /api/app/restaurants/                | ✅ Implemented | `useRestaurants`         |       |
| GET /api/app/restaurants/{id}/           | ✅ Implemented | `useRestaurantDetail`    |       |
| GET /api/app/restaurant_categories/      | ✅ Implemented | `useCategories`          |       |
| GET /api/app/customer/                   | ✅ Implemented | `useCustomerProfile`     |       |
| POST /api/app/customer/register/         | ✅ Implemented | `useRegisterCustomer`    |       |
| GET /api/app/cart/                       | ✅ Implemented | `useCart`                |       |
| POST /api/app/cart/                      | ✅ Implemented | `useAddToCart`           |       |
| DELETE /api/app/cart/                    | ✅ Implemented | `useRemoveFromCart`      |       |
| GET /api/app/orders/                     | ✅ **NEW**     | `useOrders`              |       |
| GET /api/app/orders/{id}/                | ✅ **NEW**     | `useOrderDetail`         |       |
| GET /api/app/orders/{id}/status/         | ✅ **NEW**     | `useOrderStatus`         |       |
| POST /api/app/cart/submit/               | ✅ **NEW**     | `useSubmitCart`          |       |
| POST /api/app/orders/{id}/cancel/        | ✅ **NEW**     | `useCancelOrder`         |       |
| POST /api/app/payment/intent/            | ✅ **NEW**     | `useCreatePaymentIntent` |       |
| POST /api/app/payment/confirm/           | ✅ **NEW**     | `useConfirmPayment`      |       |
| GET /api/app/customer/addresses/         | ✅ **NEW**     | `useAddresses`           |       |
| POST /api/app/customer/addresses/        | ✅ **NEW**     | `useCreateAddress`       |       |
| DELETE /api/app/customer/addresses/{id}/ | ✅ **NEW**     | `useDeleteAddress`       |       |

## Next Steps

1. **Stripe Integration**: Implement Stripe Elements for payment UI
2. **Error Messages**: Create user-friendly error message components
3. **Loading States**: Add loading indicators for all async operations
4. **Optimistic Updates**: Consider optimistic updates for cart operations
5. **Offline Support**: Add React Query persistence for offline scenarios

## Support

For issues or questions:

- Check the API documentation provided
- Review error responses from backend
- Verify environment variables are set correctly
- Ensure backend CORS is configured for your frontend domain
