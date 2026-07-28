import { restaurantsData, restaurantCategoriesData } from './restaurantData';

// Map category IDs to icons
const categoryIcons: { [key: number]: string } = {
  1: "/images/burger.png", // Fast Food
  2: "/images/pizza.png",  // Italian
  3: "/images/Food.png",   // Healthy
  4: "/images/sushi.png",  // Japanese
};

export const categories = restaurantCategoriesData.map(category => ({
  name: category.name,
  icon: categoryIcons[category.id] || "/images/result1.png",
  id: category.id
}));

export const filters = [
  "Anti Waste",
  "New",
  "Free delivery",
  "Healthy Food",
  "Gluten-Free",
  "Lactose-Free",
  "Vegetarian",
  "Vegan",
  "Today",
  "Tomorrow",
  "After 10 pm",
];

// Mock opening times for restaurants (in real app, this would come from API)
const getOpeningTime = (restaurantId: number, isOpen: boolean): string => {
  if (isOpen) return "Open now";
  
  // Mock opening times for closed restaurants
  const openingTimes: { [key: number]: string } = {
    34: "22:00", // Chez Mammà
    67: "18:00", // Restaurant du Commerce
    1: "06:00",  // McDonald's
  };
  
  return `Closed – Opens at ${openingTimes[restaurantId] || "18:00"}`;
};

// Transform restaurant data to match the partners format
export const partners = restaurantsData.map(restaurant => {
  const mainImage = restaurant.images.length > 0 
    ? restaurant.images[0].image 
    : "/images/result1.png"; // Default image

  const deliveryText = restaurant.delivery_fee === 0 
    ? "Free Delivery" 
    : `${restaurant.delivery_fee.toFixed(2)} CHF Delivery`;

  const badge = restaurant.no_waste ? "No waste" : "";

  return {
    id: restaurant.id,
    image: mainImage,
    title: restaurant.name,
    description: `${restaurant.rating.toFixed(1)} (${restaurant.reviews}) | Min. ${restaurant.min_amount.toFixed(2)} CHF | 30-50 min`,
    buttonText: deliveryText,
    badge: badge,
    time: getOpeningTime(restaurant.id, restaurant.open),
    isNew: restaurant.reviews < 50, // Consider restaurants with less than 50 reviews as new
    open: restaurant.open,
    rating: restaurant.rating,
    reviews: restaurant.reviews,
    minAmount: restaurant.min_amount,
    deliveryFee: restaurant.delivery_fee,
    noWaste: restaurant.no_waste,
    categories: restaurant.categories,
    // Add dietary information (mock data - in real app this would come from API)
    dietary: {
      glutenFree: restaurant.id === 67 || restaurant.id === 34,
      lactoseFree: restaurant.id === 67,
      vegetarian: restaurant.id === 67,
      vegan: restaurant.id === 67,
    }
  };
}); 