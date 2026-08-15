// Restaurant hooks
export {
  restaurantKeys,
  useRegisterRestaurant,
  useRestaurantCatalog,
  useRestaurantDetail,
  useRestaurants,
} from "./use-restaurants";

// Category hooks
export { categoryKeys, useCategories } from "./use-categories";

// Public location autocomplete
export { locationKeys, useAddressAutocomplete } from "./use-locations";
export type { AddressSuggestion } from "./use-locations";

// Customer hooks
export {
  customerKeys,
  ownerKeys,
  useAuth,
  useCustomerProfile,
  useLogin,
  useLogout,
  useRegisterCustomer,
  useRestaurantOwnerProfile,
} from "./use-customer";
export type { LoginResult, LoginRole } from "./use-customer";

// Cart hooks
export {
  cartKeys,
  useAddMenuItemToCart,
  useAddNoWasteItemToCart,
  useAddToCart,
  useApplyPromoCode,
  useCart,
  useClearCart,
  useRemoveFromCart,
  useRemovePromoCode,
  useUpdateCartItem,
  useValidateCart,
} from "./use-cart";

// Order hooks
export {
  orderKeys,
  useCancelOrder,
  useCreateOrder,
  useOrderDetail,
  useOrders,
  useOrderStatus,
  useSubmitCart,
} from "./use-orders";

// Payment hooks
export { useConfirmPayment, useCreatePaymentIntent } from "./use-payment";
export { useConfirmPasswordReset, useRequestPasswordReset, useValidatePasswordReset } from "./use-password-reset";

// Restaurant owner-side hooks (sales, orders)
export {
  ORDER_STATUS_VALUES,
  ownerOrdersKeys,
  ownerRankingKeys,
  ownerSalesKeys,
  useCancelRestaurantOrder,
  useMarkOrderCompleted,
  useMarkOrderDelivering,
  useMarkOrderPreparing,
  useMarkOrderReady,
  useRestaurantOrders,
  useRestaurantRanking,
  useRestaurantSales,
  useUpdateRestaurantDelivery,
  useUpdateRestaurantOpenings,
  useUpdateRestaurantSettings,
} from "./use-restaurant-owner";
export type {
  RestaurantDeliveryPayload,
  RestaurantOpeningShift,
  RestaurantOrderListItem,
  RestaurantOrderStatus,
  RestaurantRankingResponse,
  RestaurantSalesItem,
  RestaurantSalesResponse,
  RestaurantSettingsPayload,
} from "./use-restaurant-owner";

// Address hooks
export {
  addressKeys,
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from "./use-addresses";

// Menu management hooks
export {
  foodsKeys,
  menuItemsKeys,
  useCreateFood,
  useCreateMenuItem,
  useCreateMenuItemOption,
  useCreateMenuItemOptionItem,
  useDeleteMenuItem,
  useDeleteMenuItemOption,
  useDeleteMenuItemOptionItem,
  useFoods,
  useMenuItem,
  useMenuItems,
  useUpdateMenuItem,
  useUpdateMenuItemOption,
  useUpdateMenuItemOptionItem,
  useUploadMenuItemImage,
} from "./use-menu";
export type {
  AllergyRef,
  Food,
  FoodPayload,
  MenuItem,
  MenuItemOption,
  MenuItemOptionItem,
  MenuItemOptionItemPayload,
  MenuItemOptionPayload,
  MenuItemPayload,
} from "./use-menu";

// Restaurant discount hooks
export {
  discountsKeys,
  useCreateDiscount,
  useDeleteDiscount,
  useDisableDiscount,
  useDiscounts,
  useEnableDiscount,
  useUpdateDiscount,
} from "./use-discounts";
export type {
  DiscountMenuItemRef,
  DiscountPayload,
  RestaurantDiscount,
} from "./use-discounts";

// Restaurant reviews hooks
export { reviewsKeys, useRestaurantReviews } from "./use-reviews";
export type { RestaurantReview } from "./use-reviews";

// Allergies hooks
export { allergiesKeys, useAllergies } from "./use-allergies";
export type { Allergy } from "./use-allergies";

// Restaurant images hooks
export {
  useDeleteRestaurantImage,
  useUploadRestaurantImage,
} from "./use-restaurant-images";
export type { RestaurantImage } from "./use-restaurant-images";

// Nowaste items hooks
export {
  nowasteKeys,
  useCreateNowasteCustom,
  useCreateNowasteItem,
  useCreateNowasteMenuItemLink,
  useDeleteNowasteCustom,
  useDeleteNowasteItem,
  useDeleteNowasteMenuItemLink,
  useNowasteItem,
  useNowasteItems,
  useUpdateNowasteCustom,
  useUpdateNowasteItem,
  useUpdateNowasteMenuItemLink,
} from "./use-nowaste";
export type {
  NowasteCustomItem,
  NowasteCustomPayload,
  NowasteItem,
  NowasteItemCreatePayload,
  NowasteItemUpdatePayload,
  NowasteMenuItemLink,
  NowasteMenuItemLinkPayload,
} from "./use-nowaste";
