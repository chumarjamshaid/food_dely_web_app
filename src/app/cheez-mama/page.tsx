"use client";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useState } from "react";
import { cartItems as initialCartItems } from "../../data/antiWasteData";
import { restaurantInfo } from "../../data/chezMamaData";

interface CartItem {
  id: string;
  image: string;
  name: string;
  price: string;
  qty: number;
}

export default function ChezMamma() {
  const [cartItems, setCartItems] = useState<CartItem[]>(
    initialCartItems.map((item, index) => ({
      ...item,
      id: `cart-${index}`,
    }))
  );

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
      <div className="flex flex-col max-w-[1400px] mx-auto">
        <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-400">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between px-8 py-6 min-h-[64px]">
            <button className="mr-6 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100">
              <Image
                src="/images/menu-icon.svg"
                alt="arrow"
                width={28}
                height={28}
              />
            </button>
            {/* Logo */}
            <div className="flex items-center mr-8">
              <span
                className="text-[32px] font-extrabold select-none"
                style={{ fontFamily: "Abril Fatface, serif" }}
              >
                <span className="text-red-600">FOOD</span>
                <span className="text-black">DELY</span>
              </span>
            </div>
            {/* Delivery & Pickup Buttons */}
            <div className="hidden sm:flex gap-4 mr-8">
              <button className="px-8 py-2 rounded-full border border-gray-400 text-black font-medium bg-white hover:bg-gray-100 transition">
                Delivery
              </button>
              <button className="px-8 py-2 rounded-full border border-gray-400 text-black font-medium bg-white hover:bg-gray-100 transition">
                Pickup
              </button>
            </div>
            {/* Search Bar */}
            <div className="hidden lg:flex items-center bg-[#F7F8FD] rounded-full px-4 py-2 w-[320px] mr-8">
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="text-red-500 mr-2"
              >
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  d="M21 21l-3.5-3.5"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none w-full text-gray-700 py-2"
              />
            </div>
            {/* Cart Icon */}
            <Link
              href="/payment"
            className="hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-[#F7F8FD] mr-6">
              <Image
                src="/images/cart-icon.svg"
                alt="cart"
                width={28}
                height={28}
              />
            </Link>
            {/* Sign In & Sign Up */}
            <Link
              href="/signin"
              className="hidden md:block text-yellow-600 text-[18px] underline hover:text-yellow-700"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hidden md:block bg-[#CD3625] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-red-700 transition"
            >
              Sign Up
            </Link>
            <LanguageSwitch theme="light" />
          </div>
        </header>
      </div>
      {/* Main Content */}
      <main className="flex flex-col lg:flex-row items-center gap-8 px-8 py-4 pt-[150px] pb-12 max-w-[1400px] mx-auto">
        {/* Left Section */}
        <section className="flex-1 flex flex-col gap-6">
          <Image
            src={restaurantInfo.mainImage}
            alt={`${restaurantInfo.name} Restaurant`}
            className="w-full h-[220px] object-cover rounded-2xl shadow-md"
            width={200}
            height={100}
          />
          {/* Restaurant Info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[28px] font-bold text-black">{restaurantInfo.name}</h2>
              <span className="flex items-center text-lg font-semibold text-black">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="text-yellow-400 mr-1"
                >
                  <path
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    fill="currentColor"
                  />
                </svg>
                {restaurantInfo.rating}
              </span>
              <span className="text-gray-400 text-base">({restaurantInfo.reviews}+ ratings)</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                restaurantInfo.open 
                  ? "bg-[#CD3625] text-white" 
                  : "bg-gray-500 text-white"
              }`}>
                {restaurantInfo.open ? "Open Now" : "Closed"}
              </span>
              <span className="text-gray-500 text-sm">|</span>
              <span className="text-gray-700 text-sm">
                {restaurantInfo.open ? "Closes at 22:30PM" : "Opens tomorrow"}
              </span>
            </div>
          </div>
          {/* DeliPass Info */}
          <div className="mt-2">
            <span className="font-normal text-[28px] text-black">
              DeliPass?
            </span>
            <span className="text-gray-400 font-normal text-[14px] ml-2">
              (Delivery is free of charge for customers who pay a monthly
              subscription fee. For restaurants that accept, ~2% fees.)
            </span>
          </div>
          {/* Ratings & Review */}
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            {/* Ratings */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-[#D0D0D0] w-full md:w-[560px]">
              <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-[#CFCFCF] pb-8">
                {/* Left: Rating number and stars */}
                <div className="flex flex-col items-center justify-center w-full">
                  <span className="text-[28px] font-semibold text-black">
                    {restaurantInfo.rating}
                  </span>
                  <div className="flex items-center my-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="text-yellow-400"
                      >
                        <path
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                          fill="currentColor"
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">(100+ ratings)</span>
                </div>

                {/* Right: Rating bars */}
                <div className="gap-2">
                  {[5, 4, 3, 2, 1].map((star, idx) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-6">
                        {star}.0
                      </span>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#F98443] to-[#F84775]"
                          style={{
                            width: ["85%", "70%", "30%", "10%", "5%"][idx],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review */}
              <div className="mt-6 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-black text-[18px]">
                    Adeel Nazeer
                  </span>
                </div>
                <div className="flex items-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="text-yellow-400"
                    >
                      <path
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        fill="currentColor"
                      />
                    </svg>
                  ))}
                  <span className="text-[#8F8F8F] ml-4 text-[16px]">
                    5 days ago
                  </span>
                </div>
                <p className="text-[#424242] text-base font-normal">
                  I had a fantastic experience hosting my daughter&apos;s
                  birthday party at Fooddely restaurant! The food was absolutely
                  delicious...
                  <span className="text-red-500 cursor-pointer">More</span>
                </p>
              </div>
              <button className="mt-4 text-[#F97252] border border-[#D0D0D0] rounded-full px-4 py-2 text-base flex items-center justify-center gap-2">
                View more reviews
                <Image
                  src="/images/chezmamma/arrow.png"
                  alt="Map"
                  className="w-6 h-6 object-contain rounded-xl"
                  width={15}
                  height={22}
                />
              </button>
            </div>
            {/* Map */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-md p-4 flex-1 flex items-center justify-center min-h-[180px]">
                <Image
                  src="/images/chezmamma/maps.png"
                  alt="Map"
                  className="w-full h-full object-contain rounded-xl"
                  width={100}
                  height={100}
                />
              </div>
              {/* Address Card */}
              <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-2 border border-[#D0D0D0]">
                <div className="flex items-center gap-2 text-gray-700 border-b border-[#CFCFCF] pb-3 mt-2">
                  <Image
                    src="/images/chezmamma/map.png"
                    alt="Map"
                    className="w-[24px] h-[32px] object-contain rounded-xl"
                    width={24}
                    height={32}
                  />
                  <div className="flex flex-col justify-center ml-3">
                    <span>10th pleasure street</span>
                    <span className="text-gray-400">Montreux, VD</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700 border-b border-[#CFCFCF] pb-3">
                  <Image
                    src="/images/chezmamma/open.png"
                    alt="Map"
                    className="w-[39px] h-[32px] object-contain rounded-xl"
                    width={30}
                    height={35}
                  />
                  <div className="flex flex-col justify-center ml-3">
                    <span>Open</span>
                    <span className="text-gray-400">
                      Accepting Delifoodz 10pm
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700 mt-2">
                  <Image
                    src="/images/chezmamma/call.png"
                    alt="Map"
                    className="w-[39px] h-[32px] object-contain rounded-xl"
                    width={30}
                    height={35}
                  />
                  <span>(41) 21.469.69.69</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Right Section - Cart & Summary */}
        <aside className="w-full md:w-[400px] flex flex-col gap-6">
          <div className="rounded-2xl shadow-md p-6 flex flex-col gap-4">
            <h3 className="text-lg font-normal text-black">Your Cart From</h3>
            <h2 className="text-3xl font-medium text-black">
              Pizza chez Mamma
            </h2>
            {/* Cart Items */}
            <div className="flex flex-col gap-4">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="w-[96px] h-16 rounded-lg object-cover"
                      width={96}
                      height={64}
                    />
                    <div className="flex flex-col justify-between gap-2">
                      <span className="font-normal text-[18px] text-black">
                        {item.name}
                      </span>
                      <div className="flex items-center justify-between px-4 py-1.5 rounded-lg border border-gray-200 w-[120px]">
                        <button
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                          className="text-xl font-bold text-black"
                        >
                          −
                        </button>
                        <span className="text-lg font-medium text-black">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          className="text-xl font-bold text-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end gap-2">
                    <span className="font-normal text-[18px] text-black ">
                      ${item.price}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <Image
                        src="/images/delete-icon.svg"
                        alt="delete"
                        width={24}
                        height={24}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Alert Box */}
            <div className="bg-gradient-to-r from-red-400 to-orange-300 text-white rounded-xl p-4 flex items-center justify-between mt-4">
              <span className="text-[18px] ">
                You can&apos;t know the composition in advance.
              </span>
              <button className="bg-white text-red-500 px-4 py-1 rounded-full font-semibold ml-4">
                Accept
              </button>
            </div>
            {/* Summary */}
            <div className="flex flex-col gap-2 mt-4">
              <div className="w-full h-[1px] bg-[#C5CBD1]"></div>
              <div className="flex justify-between text-black text-base">
                <span>Sub total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-black text-base">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-black text-base">
                <span>Taxes</span>
                <span>${taxes.toFixed(2)}</span>
              </div>
              <div className="w-full h-[1px] bg-[#C5CBD1]"></div>
              <div className="flex justify-between text-2xl font-normal text-black mt-2">
                <span>Total</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/payment"
              className="mt-6 bg-[#CD3625] text-white rounded-full py-4 text-lg font-bold shadow-lg hover:from-red-600 hover:to-orange-500 transition flex items-center justify-center gap-2"
            >
              Order and checkout
              <Image
                src="/images/leftarrow.svg"
                alt="arrow"
                width={24}
                height={24}
              />
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
