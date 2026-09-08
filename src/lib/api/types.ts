// API Response types based on backend documentation

// Restaurant Image type
export interface RestaurantImage {
  id: number;
  image: string;
}

// Restaurant Category type (from list response)
export interface RestaurantCategoryItem {
  id: number;
  name: string;
  description: string;
  icon?: string | null;
}

// Restaurant types
export interface RestaurantListItem {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  min_amount: number;
  average_amount: number;
  no_waste: boolean;
  delivery_available: boolean;
  delivery_fee: number;
  rating: number;
  reviews: number;
  active: boolean;
  open: boolean;
  categories: RestaurantCategoryItem[];
  images: RestaurantImage[];
  openings?: { day: string; start: string; end: string }[];
  discounts?: PublicRestaurantDiscount[];
}

export interface MenuFoodCategory {
  id: number;
  name: string;
  description: string;
  image: string | null;
  icon?: string | null;
  menu_items: MenuItemResponse[];
}

export interface NoWasteItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
}

export interface PublicRestaurantDiscount {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  price_reduction_percentage: number | null;
  price_reduction_amount: number | null;
  price_reduction_min: number | null;
  menu_items?: { id: number; name: string; description?: string }[];
}

export interface RestaurantDetailResponse {
  id: number;
  name: string;
  description?: string;
  address: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  min_amount?: number;
  average_amount?: number;
  no_waste?: boolean;
  delivery_available?: boolean;
  delivery_fee?: number;
  rating?: number;
  reviews?: number;
  active?: boolean;
  open?: boolean;
  images?: RestaurantImage[];
  openings?: { day: string; start: string; end: string }[];
  discounts?: PublicRestaurantDiscount[];
  categories: RestaurantCategoryResponse[];
  foods: MenuFoodCategory[];
  nowaste_items: NoWasteItem[];
  upsell_items?: MenuItemResponse[];
  // Legacy support - keep menu_items for backward compatibility
  menu_items?: MenuItemResponse[];
}

// Restaurant Category types (from /api/app/restaurant_categories/)
export interface RestaurantCategoryResponse {
  id: number;
  name: string;
  description: string;
  icon?: string | null;
}

// Allergy type
export interface AllergyResponse {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

// Menu Item types (from restaurant detail)
export interface MenuItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  options: MenuItemOptionGroupResponse[];
  allergies: (string | AllergyResponse)[];
  discounts?: PublicRestaurantDiscount[];
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant?: { id: number; name: string };
}

export interface MenuItemOptionGroupResponse {
  id: number;
  name: string;
  multiple: boolean;
  required: boolean; // New field - true means option is mandatory
  minimum_selections?: number;
  maximum_selections?: number;
  items: MenuItemOptionResponse[];
}

export interface MenuItemOptionResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  allergies: string[];
  available?: boolean;
}

// Customer types
export interface CustomerProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  birthday: string;
  addresses?: CustomerAddress[];
}

export interface CustomerRegisterData {
  firstname: string;
  lastname: string;
  birthday: string;
  address: string;
  postal_code: string;
  city: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
}

// Restaurant owner profile returned by GET /api/app/restaurant/
export interface RestaurantOwnerProfile {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  meat_origin?: string;
  fish_origin?: string;
  owner_username?: string;
  owner_firstname?: string;
  owner_lastname?: string;
  owner_email?: string;
  active?: boolean;
  open?: boolean;
  manually_closed?: boolean;
  availability_status?:
    | "open"
    | "outside_opening_hours"
    | "manually_closed"
    | "planned_closing"
    | "inactive"
    | "pending_validation";
  active_planned_closing?: RestaurantClosingPeriod | null;
  validation_status?: "pending" | "approved" | "declined";
  validation_decline_reason?: string;
  validation_decision_at?: string | null;
  min_amount?: number;
  average_amount?: number;
  no_waste?: boolean;
  delivery_available?: boolean;
  delivery_radius?: number;
  delivery_fee?: number;
  delivery_time?: number;
  ranking_cost_per_order?: string | number;
  rating?: number;
  reviews?: number;
  openings?: { day: string; start: string; end: string }[];
  images?: { id: number; image: string }[];
}

export interface RestaurantClosingPeriod {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  enabled: boolean;
  is_currently_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RestaurantRegisterData {
  name: string;
  firstname: string;
  lastname: string;
  address: string;
  city: string;
  postal_code: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
}

// Cart types
export interface CartResponse {
  id: number;
  customer: number | null;
  session_id: string | null;
  items: CartItemResponse[];
  subtotal: string | number;
  restaurant_discount: string | number;
  delivery_fee: string | number;
  promo_code: string | null;
  promo_discount: string | number;
  promo_error?: string | null;
  tip_amount: string | number;
  total: string | number;
  currency: string;
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant?: { id: number; name: string };
  /** Compatibility with responses from older deployments. */
  total_price?: string;
}

export interface CartItemResponse {
  id: number;
  /** Restaurant ID this item belongs to (when returned by API). Used to enforce single-restaurant cart. */
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant?: { id: number; name: string };
  menu_item?: MenuItemResponse;
  nowaste_item?: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string | null;
    restaurant_id?: number;
    restaurant_name?: string;
    restaurant?: { id: number; name: string };
  };
  quantity: number;
  options?: CartItemOptionResponse[];
}

export interface CartItemOptionResponse {
  id: number;
  option: number;
  menu_item_option_item: number | number[]; // Can be single or multiple selections
  item?: number; // Alias for menu_item_option_item (backward compatibility)
}

// Add to cart request types
export interface AddMenuItemToCartRequest {
  quantity: number;
  menu_item: number;
  options?: {
    option: number;
    item: number;
  }[];
}

export interface AddNoWasteItemToCartRequest {
  quantity: number;
  nowaste_item: number;
}

export type AddToCartRequest =
  | AddMenuItemToCartRequest
  | AddNoWasteItemToCartRequest;

// Query parameter types
export interface RestaurantQueryParams {
  search?: string;
  category?: number;
}

// Order types
export type OrderStatus =
  | "placed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "can_cust"
  | "can_rest";

export interface OrderDelivery {
  firstname: string;
  lastname: string;
  address: string;
  postal_code: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface OrderItem {
  id: number;
  menu_item?: MenuItemResponse;
  nowaste_item?: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string | null;
    restaurant_id?: number;
    restaurant_name?: string;
    restaurant?: { id: number; name: string };
  };
  quantity: number;
  options?: CartItemOptionResponse[];
  price: number;
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant?: { id: number; name: string };
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  price: number | string;
  placed: string;
  created_at?: string;
  items: OrderItem[];
  restaurant_id?: number;
  restaurant_name?: string;
  restaurant?: { id: number; name: string };
}

export interface OrderDetailResponse extends OrderListItem {
  delivery?: OrderDelivery;
  delivery_firstname?: string;
  delivery_lastname?: string;
  delivery_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  delivery_phone?: string;
  delivery_email?: string;
  subtotal?: string | number;
  restaurant_discount?: string | number;
  delivery_fee?: string | number;
  promo_code?: string | null;
  promo_discount?: string | number;
  tip_amount?: string | number;
  total?: string | number;
  currency?: string;
  updated_at?: string;
  cancel_reason?: string;
  status_reason?: string | null;
}

export interface OrderStatusResponse {
  id: number;
  status: OrderStatus;
  updated_at: string;
}

export interface SubmitCartRequest {
  delivery_firstname: string;
  delivery_lastname: string;
  delivery_address: string;
  delivery_postal_code: string;
  delivery_city: string;
  delivery_phone: string;
  delivery_email: string;
}

export interface CancelOrderRequest {
  reason: string;
}

// Payment types
export interface PaymentIntentRequest {
  delivery_firstname?: string;
  delivery_lastname?: string;
  delivery_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  delivery_phone?: string;
  delivery_email?: string;
  tip_amount?: number;
}

export interface PaymentIntentResponse {
  id?: number;
  customer?: unknown;
  session_id?: string | null;
  payment_intent_id?: string;
  payment_intent_client_secret?: string;
  // Legacy support - also check for client_secret
  client_secret?: string;
  cart_id?: number;
  total_price?: string;
  subtotal?: string | number;
  restaurant_discount?: string | number;
  delivery_fee?: string | number;
  promo_discount?: string | number;
  tip_amount?: string | number;
  total?: string | number;
  currency?: string;
}

export interface PaymentConfirmRequest {
  payment_intent_id: string;
}

export interface PaymentConfirmResponse extends OrderDetailResponse {
  payment_intent_id: string;
  payment_status: string;
}

// Customer Address types
export interface CustomerAddress {
  id: number;
  address: string;
  postal_code: string;
  city: string;
  default: boolean;
}

export interface CreateCustomerAddressRequest {
  address: string;
  postal_code: string;
  city: string;
  default?: boolean;
  latitude?: number;
  longitude?: number;
}

export type UpdateCustomerAddressRequest = Partial<CreateCustomerAddressRequest>;

// Query parameter types
export interface RestaurantQueryParams {
  search?: string;
  category?: number;
  delivery?: boolean;
  reviews?: number;
  nowaste?: boolean;
  discounts?: boolean;
  allergies?: string;
  open?: boolean;
  lat?: number;
  lng?: number;
  address?: string;
}

// API Error type
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
