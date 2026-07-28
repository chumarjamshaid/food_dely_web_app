import { noWasteItemsData } from './restaurantData';

export const categories = ["Anti-waste"];

export const timeSlots = ["11:00 am - 14:00 pm", "06:30 pm - 10:30 pm"];

// Transform no-waste items data to match the existing format
export const antiWasteProducts = noWasteItemsData.map(item => ({
  id: item.id,
  image: item.image || "/images/menu.png", // Default image if none provided
  price: `$ ${item.price.toFixed(2)}`,
  name: item.name,
  desc: item.description || "No waste pack",
  content: item.content,
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
    image: "/images/desert-2.png",
    name: "Ice cream",
    price: "$79.99",
    qty: 1,
  },
]; 