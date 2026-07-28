"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  antiWasteProducts,
  categories,
  cartItems as initialCartItems,
  timeSlots,
} from "../../data/antiWasteData";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  image: string;
  name: string;
  price: string;
  qty: number;
}

interface Product {
  image: string;
  price: string;
  name: string;
  desc: string;
}

export default function AntiWastePage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>(
    initialCartItems.map((item, index) => ({
      ...item,
      id: `cart-${index}`,
    }))
  );

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.name === product.name);

    if (existingItem) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === existingItem.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        image: product.image,
        name: product.name,
        price: product.price,
        qty: 1,
      };
      setCartItems((prev) => [...prev, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty: newQty } : item))
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace("$", "").trim());
      return total + price * item.qty;
    }, 0);
  };

  const subtotal = calculateTotal();
  const deliveryFee = 9.2;
  const taxes = subtotal * 0.15;
  const total = subtotal + deliveryFee + taxes;

  return (
    <div className="bg-white">
      <div className="min-h-screen bg-white max-w-[1400px] mx-auto flex flex-col items-center py-8 px-2">
        <div className="bg-white rounded-3xl w-full max-w-[1200px] mx-auto pb-8 relative">
          <div className="mb-2">
            <div className="md:text-[24px] text-[20px] font-medium text-black mb-1">
              Chez Mamma
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-[#8F8F8F] font-medium text-base md:text-lg mb-4 overflow-x-auto pb-2">
              {timeSlots.map((slot, i) => (
                <span key={i} className="flex items-center whitespace-nowrap">
                  {slot}
                  {i !== timeSlots.length - 1 && (
                    <span className="mx-2 md:mx-4 text-gray-300 text-lg md:text-xl">
                      |
                    </span>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 md:gap-4 mb-2">
              <button className="flex items-center justify-center mr-2 pb-2">
                <Image
                  src="/images/menu-icon.svg"
                  alt="menu"
                  width={28}
                  height={28}
                />
              </button>
              <div className="flex items-center justify-between overflow-x-auto pb-2 w-full">
                {categories.map((cat, i) => (
                  <Link href={`/cheez-mama`} key={cat}>
                    <button
                      className={`px-4 md:px-6 py-2 rounded-full font-normal text-sm md:text-base whitespace-nowrap shadow-sm border transition-all duration-150 ${
                        i === 0
                          ? "bg-[#CD3625] text-white"
                          : "bg-white text-black border-gray-50"
                      }`}
                    >
                      {cat}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
            <div className="w-full h-px bg-gray-200 mt-2" />
          </div>
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 mt-6">
            {/* Left: Main Content */}
            <div className="flex-1 min-w-0 order-2 lg:order-1">
              {/* Note Card */}
              <div className="mb-6 md:mb-8 relative">
                <div className="bg-white rounded-2xl shadow p-4 md:p-6 lg:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-6 lg:gap-8 relative min-h-[200px] md:min-h-[250px] lg:min-h-[300px]">
                  <div className="flex-1 w-full">
                    <div className="text-[20px] md:text-[24px] lg:text-[28px] font-bold text-black mb-2">
                      Note
                    </div>
                    <div className="text-[14px] md:text-[16px] lg:text-[18px] text-[#222] mb-4 md:mb-6 pr-0 md:pr-8 lg:pr-48">
                      Anti-waste baskets are made up of multiple products. You
                      can&apos;t know the composition in advance. You buy the
                      day&apos;s unsold produce, which is still of very high
                      quality.
                    </div>
                    <Link
                      href="/learn-more"
                    className="border w-42 text-center border-[#CD3625] text-[#CD3625] rounded-full px-4 md:px-6 py-2 font-medium flex items-center gap-2 text-[14px] md:text-[16px] hover:bg-[#FFF0EE] transition cursor-pointer">
                      Learn more
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#CD3625"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                  {/* Two faint concentric circles on the right - hidden on mobile */}
                  <div className="absolute right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
                    <svg
                      width="200"
                      height="200"
                      viewBox="0 0 200 200"
                      fill="none"
                    >
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        stroke="#FDE7E3"
                        strokeWidth="2"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="60"
                        stroke="#FDE7E3"
                        strokeWidth="1.2"
                        opacity="0.7"
                      />
                    </svg>
                  </div>
                </div>
                {/* Carousel dots outside the card - hidden on mobile */}
                <div className="absolute right-[-25px] top-1/2 -translate-y-1/2 flex-col gap-3 z-10 hidden lg:flex">
                  <span className="w-4 h-4 rounded-full bg-[#F84F4F] block border-2 border-white shadow" />
                  <span className="w-4 h-4 rounded-full bg-[#E5E5E5] block border-2 border-white shadow" />
                  <span className="w-4 h-4 rounded-full bg-[#E5E5E5] block border-2 border-white shadow" />
                  <span className="w-4 h-4 rounded-full bg-[#E5E5E5] block border-2 border-white shadow" />
                </div>
              </div>
              {/* Anti-Waste Section */}
              <div className="mb-6 md:mb-8">
                <div className="text-[20px] md:text-[24px] lg:text-[28px] font-bold text-black mb-2">
                  Anti-Waste
                </div>
                <div className="text-[14px] md:text-[16px] text-[#8F8F8F] mb-2 md:mb-3">
                  Enjoy eating for less
                </div>
                <div className="text-[14px] md:text-[16px] text-[#8F8F8F] mb-4 md:mb-6">
                  Recover at 9 pm - 10:30 pm
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {antiWasteProducts.map((item, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col md:flex-row bg-white rounded-xl shadow-lg w-full md:w-[420px] h-auto md:h-[230px] items-center overflow-hidden"
                    >
                      <div className="w-full md:w-[190px] h-[200px] md:h-[190px] rounded-xl overflow-hidden flex-shrink-0 relative md:ml-4 md:mt-3">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col p-4 md:pl-6 md:pr-4 md:py-10 flex-1 h-full w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[18px] md:text-[20px] font-medium text-[#373A3C]">
                            {item.price}
                          </span>
                        </div>
                        <div className="text-[18px] md:text-[20px] font-medium text-[#373A3C] my-2 md:my-3 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[12px] md:text-[10px] text-[#48555B] leading-snug mt-1">
                          {item.desc}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="absolute bottom-4 right-4 md:right-6 w-8 h-8 bg-[#CD3625] rounded-full flex items-center justify-center text-white text-2xl md:text-3xl shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <Image
                          src="/images/plus-icon.svg"
                          alt="menu"
                          width={20}
                          height={20}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Right: Cart Sidebar */}
            <div className="w-full lg:w-[320px] flex-shrink-0 order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow p-4 md:p-6 mb-4 md:mb-6">
                {/* Cart Title */}
                <div className="text-[14px] md:text-[16px] text-[#444] font-normal mb-1">
                  Your Cart From
                </div>
                <div className="text-[20px] md:text-[24px] lg:text-[28px] font-medium text-[#222] mb-4 md:mb-6 leading-tight">
                  Pizza chez Mamma
                </div>
                {/* Cart Items */}
                <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-8">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 md:gap-4"
                    >
                      <div className="w-[80px] md:w-[100px] h-[60px] md:h-[70px] rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-[16px] md:text-[18px] font-normal text-[#222] truncate">
                            {item.name}
                          </div>
                          <div className="text-[14px] md:text-[16px] font-normal text-[#222] ml-2 md:ml-4">
                            {item.price}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 bg-white">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.qty - 1)
                              }
                              className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[16px] md:text-[20px] font-medium text-[#222] cursor-pointer hover:bg-gray-100 rounded"
                            >
                              -
                            </button>
                            <span className="mx-2 text-[16px] md:text-[18px] font-medium text-[#222]">
                              {item.qty}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.qty + 1)
                              }
                              className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[16px] md:text-[20px] font-medium text-[#222] cursor-pointer hover:bg-gray-100 rounded"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 cursor-pointer hover:opacity-70 transition-opacity"
                          >
                            <Image
                              src="/images/delete-icon.svg"
                              alt="trash"
                              width={18}
                              height={18}
                              className="md:w-6 md:h-6"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Warning Card */}
                <div className="bg-gradient-to-b from-[#F98443] to-[#F84775] rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                  <span className="text-white text-[13px] md:text-[15px] font-medium flex-1">
                    You can&apos;t know the composition in advance.
                  </span>
                  <button className="bg-white text-black font-semibold rounded px-3 md:px-4 py-1 text-[13px] md:text-[15px] shadow border border-[#CD3625] cursor-pointer">
                    Accept
                  </button>
                </div>
                {/* Cart Summary */}
                <div className="border-t border-gray-200 pt-8 md:pt-12 mt-2 flex flex-col gap-1.5 text-[15px] md:text-[17px] text-[#222]">
                  <div className="flex justify-between">
                    <span>Sub total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2" />
                  <div className="flex justify-between items-center font-medium text-[20px] md:text-[24px] mt-2">
                    <span>Total</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                </div>
                {/* Checkout Button */}
                <Link
                  href="/payment"
                className="mt-6 md:mt-8 w-full bg-[#CD3625] hover:bg-red-600 text-white font-bold py-3 px-2 rounded-full text-[18px] md:text-[20px] flex items-center justify-center gap-3 md:gap-4 shadow-lg transition cursor-pointer" onClick={() => router.push("/cheez-mama")}>
                  Order and checkout
                  <Image
                    src="/images/leftarrow.svg"
                    alt="arrow"
                    width={20}
                    height={20}
                    className="md:w-6 md:h-6"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
