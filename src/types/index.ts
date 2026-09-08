export interface RestaurantCategory {
  id: number;
  name: string;
  description: string;
}

export interface RestaurantImage {
  id: number;
  image: string;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  open: boolean;
  rating: number;
  reviews: number;
  min_amount: number;
  average_amount: number;
  delivery_fee: number;
  no_waste: boolean;
  categories: number[];
  images: RestaurantImage[];
}

export interface MenuCategory {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

export interface RestaurantDetail {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  open: boolean;
  rating: number;
  reviews: number;
  min_amount: number;
  average_amount: number;
  delivery_fee: number;
  no_waste: boolean;
  categories: number[];
  images: RestaurantImage[];
  foods: MenuCategory[];
}

export interface MenuItemOption {
  id: number;
  name: string;
  description: string;
  price: number;
  allergies: string[];
}

export interface MenuItemOptionGroup {
  id: number;
  name: string;
  multiple: boolean;
  items: MenuItemOption[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  options: MenuItemOptionGroup[];
  allergies: string[];
}

export interface MenuCategoryWithItems {
  id: number;
  name: string;
  description: string;
  image: string | null;
  menu_items: MenuItem[];
}

export interface NoWasteItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  content: string[];
}

// New types for manage menu functionality
export interface ManageMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  popular: boolean;
}

export interface MenuItemFormData {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  popular: boolean;
}

// Types for restaurant settings
export interface RestaurantSettings {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  open: boolean;
  rating: number;
  reviews: number;
  min_amount: number;
  average_amount: number;
  delivery_fee: number;
  no_waste: boolean;
  categories: number[];
  images: RestaurantImage[];
  opening_hours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  delivery_settings: DeliverySettingsData;
}

export interface OpeningHoursData {
  open: string;
  close: string;
  closed: boolean;
}

export interface DeliverySettingsData {
  delivery_radius: number;
  min_order_amount: number;
  delivery_fee: number;
  free_delivery_threshold: number;
  estimated_delivery_time: number;
  min_order: number;
  delivery_time: string;
  delivery_available: boolean;
} 
