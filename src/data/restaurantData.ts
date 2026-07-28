import restaurantCategories from './restaurant_categories.json';
import restaurants from './restaurants.json';
import restaurantDetail from './restaurant_detail_with_menu_categories.json';
import menuCategoryWithItems from './restaurant_menu_category_with_items.json';
import noWasteItems from './restaurant_no_waste_items.json';

import type {
  RestaurantCategory,
  Restaurant,
  RestaurantDetail,
  MenuCategoryWithItems,
  NoWasteItem
} from '../types';

export const restaurantCategoriesData: RestaurantCategory[] = restaurantCategories;
export const restaurantsData: Restaurant[] = restaurants;
export const restaurantDetailData: RestaurantDetail = restaurantDetail;
export const menuCategoryWithItemsData: MenuCategoryWithItems = menuCategoryWithItems;
export const noWasteItemsData: NoWasteItem[] = noWasteItems;

// Helper functions
export const getRestaurantById = (id: number): Restaurant | undefined => {
  return restaurantsData.find(restaurant => restaurant.id === id);
};

export const getRestaurantCategories = (): RestaurantCategory[] => {
  return restaurantCategoriesData;
};

export const getRestaurantsByCategory = (categoryId: number): Restaurant[] => {
  return restaurantsData.filter(restaurant => 
    restaurant.categories.includes(categoryId)
  );
};

export const getNoWasteRestaurants = (): Restaurant[] => {
  return restaurantsData.filter(restaurant => restaurant.no_waste);
};

export const getOpenRestaurants = (): Restaurant[] => {
  return restaurantsData.filter(restaurant => restaurant.open);
}; 