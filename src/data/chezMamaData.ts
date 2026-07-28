import { restaurantDetailData, menuCategoryWithItemsData } from './restaurantData';

// Restaurant information
export const restaurantInfo = {
  name: restaurantDetailData.name,
  description: restaurantDetailData.description,
  address: restaurantDetailData.address,
  city: restaurantDetailData.city,
  postalCode: restaurantDetailData.postal_code,
  phone: restaurantDetailData.phone,
  open: restaurantDetailData.open,
  rating: restaurantDetailData.rating,
  reviews: restaurantDetailData.reviews,
  minAmount: restaurantDetailData.min_amount,
  averageAmount: restaurantDetailData.average_amount,
  deliveryFee: restaurantDetailData.delivery_fee,
  noWaste: restaurantDetailData.no_waste,
  mainImage: restaurantDetailData.images.length > 0 
    ? restaurantDetailData.images[0].image 
    : "/images/chezmamma/main.png",
};

// Menu categories
export const menuCategories = restaurantDetailData.foods.map(food => ({
  id: food.id,
  name: food.name,
  description: food.description,
  image: food.image,
}));

// Menu items from the Pizzas category
export const menuItems = menuCategoryWithItemsData.menu_items.map(item => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image || "/images/pizza-1.png",
  options: item.options,
  allergies: item.allergies,
}));

// Popular items (first 2 items)
export const popularItems = menuItems.slice(0, 2);

// All menu items with formatted prices
export const formattedMenuItems = menuItems.map(item => ({
  ...item,
  formattedPrice: `$ ${item.price.toFixed(2)}`,
  oldPrice: `$ ${(item.price * 1.2).toFixed(2)}`,
  discount: "-20%",
})); 