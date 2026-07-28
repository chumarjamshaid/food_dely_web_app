import { restaurantDetailData, menuCategoryWithItemsData, noWasteItemsData } from './restaurantData';

// Get menu categories from restaurant detail
export const categories = [
  "Popular Items",
  ...restaurantDetailData.foods.map(food => food.name),
  "Anti-waste",
];

export const timeSlots = ["11:00 am - 14:00 pm", "06:30 pm - 10:30 pm"];

// Transform menu items to match the existing format
export const popularItems = menuCategoryWithItemsData.menu_items.slice(0, 2).map(item => ({
  id: item.id.toString(),
  image: item.image || "/images/menu.png",
  name: item.name,
  desc: item.description,
  price: `$ ${item.price.toFixed(2)}`,
  oldPrice: `$ ${(item.price * 1.2).toFixed(2)}`, // 20% markup for old price
  discount: "-20%",
  badge: "#1 most liked",
  options: [
    {
      name: "Size",
      required: true,
      choices: [
        { name: "Small", price: 0 },
        { name: "Medium", price: 2 },
        { name: "Large", price: 4 }
      ]
    },
    {
      name: "Crust",
      required: false,
      choices: [
        { name: "Thin", price: 0 },
        { name: "Thick", price: 1 },
        { name: "Stuffed", price: 3 }
      ]
    }
  ],
  allergies: item.allergies || ["Gluten", "Dairy"],
  ingredients: ["Fresh tomatoes", "Mozzarella", "Basil", "Olive oil"]
}));

export const beverages = [
  {
    id: "beverage-1",
    image: "/images/coke.png",
    name: "Coca Cola (3 dl)",
    price: "$ 2.00",
    oldPrice: "$ 10.00",
    discount: "-20%",
    badge: undefined,
    desc: undefined,
    options: [
      {
        name: "Size",
        required: true,
        choices: [
          { name: "Small (250ml)", price: 0 },
          { name: "Medium (500ml)", price: 0.5 },
          { name: "Large (1L)", price: 1 }
        ]
      }
    ],
    allergies: [],
    ingredients: ["Carbonated water", "Sugar", "Natural flavors"]
  },
  {
    id: "beverage-2",
    image: "/images/water.png",
    name: "Water Evian (3 dl)",
    price: "$ 2.00",
    oldPrice: "$ 10.00",
    discount: "-20%",
    badge: undefined,
    desc: undefined,
    options: [],
    allergies: [],
    ingredients: ["Natural spring water"]
  },
];

export const desserts = [
  {
    id: "dessert-1",
    image: "/images/desert-1.png",
    name: "Desert Sweat",
    desc: "Mushroom, Ham, Cheese and Basil",
    price: "$ 4,99",
    oldPrice: "$ 10.00",
    discount: "-20%",
    badge: "#1 most liked",
    options: [
      {
        name: "Toppings",
        required: false,
        choices: [
          { name: "Chocolate sauce", price: 1 },
          { name: "Caramel sauce", price: 1 },
          { name: "Whipped cream", price: 0.5 }
        ]
      }
    ],
    allergies: ["Nuts", "Dairy"],
    ingredients: ["Vanilla ice cream", "Chocolate", "Caramel"]
  },
  {
    id: "dessert-2",
    image: "/images/desert-2.png",
    name: "Desert Sweat",
    desc: "Mushroom, Ham, Cheese and Basil",
    price: "$ 4,99",
    oldPrice: "$ 10.00",
    discount: "-20%",
    badge: "#1 most liked",
    options: [],
    allergies: ["Gluten"],
    ingredients: ["Flour", "Sugar", "Eggs", "Butter"]
  },
];

// Get all menu items from the menu category
export const allMenuItems = menuCategoryWithItemsData.menu_items.map(item => ({
  id: item.id.toString(),
  image: item.image || "/images/menu.png",
  name: item.name,
  desc: item.description,
  price: `$ ${item.price.toFixed(2)}`,
  oldPrice: `$ ${(item.price * 1.2).toFixed(2)}`,
  discount: "-20%",
  badge: item.price > 20 ? "#Premium" : undefined,
  options: [
    {
      name: "Customization",
      required: false,
      choices: [
        { name: "Extra cheese", price: 2 },
        { name: "Extra meat", price: 3 },
        { name: "Extra vegetables", price: 1 }
      ]
    }
  ],
  allergies: item.allergies || [],
  ingredients: ["Fresh ingredients", "Local produce"]
}));

// Get no-waste items
export const antiWasteItems = noWasteItemsData.map(item => ({
  id: item.id.toString(),
  image: item.image || "/images/menu.png",
  name: item.name,
  desc: item.description,
  price: `$ ${item.price.toFixed(2)}`,
  oldPrice: `$ ${(item.price * 1.3).toFixed(2)}`,
  discount: "-30%",
  badge: "No waste",
  content: item.content,
  options: [],
  allergies: [],
  ingredients: item.content || ["Sustainable ingredients"]
}));

export const cartItems = [
  {
    image: "/images/menu.png",
    name: "Pizza",
    price: "$79.99",
    qty: 1,
  },
  {
    image: "/images/pizza-1.png",
    name: "Pizza",
    price: "$79.99",
    qty: 1,
  },
  {
    image: "/images/desert-1.png",
    name: "Ice cream",
    price: "$79.99",
    qty: 1,
  },
]; 