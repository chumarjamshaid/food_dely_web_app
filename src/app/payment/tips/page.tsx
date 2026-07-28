"use client";
import Image from "next/image";
import { paymentTips, TipCardProps } from "@/data/paymentTipsData";
import { useState } from "react";

function TipCard({ image, title, desc, link, isFavorited, onToggleFavorite }: TipCardProps & { isFavorited: boolean; onToggleFavorite: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex gap-4 items-start relative sm:min-h-[220px] w-full">
      <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] lg:w-[180px] lg:h-[180px] rounded-xl overflow-hidden flex-shrink-0">
        <Image src={image} alt={title} width={180} height={180} className="object-cover w-full h-full" />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-[16px] sm:text-[18px] lg:text-[20px] font-bold text-black mb-1">{title}</div>
        <div className="text-gray-500 text-xs sm:text-sm mb-2">{desc}</div>
        <a href={link} className="text-[#FF6600] font-medium text-xs sm:text-sm flex items-center gap-1 mt-4 lg:mt-6">
          Learn More <span>→</span>
        </a>
      </div>
      <button 
        className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6"
        onClick={onToggleFavorite}
      >
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-6 sm:h-6 lg:w-7 lg:h-7">
          <path d="M24.0954 14.9292L15.236 23.7886C15.0743 23.9519 14.8818 24.0816 14.6697 24.1701C14.4575 24.2586 14.23 24.3042 14.0001 24.3042C13.7702 24.3042 13.5426 24.2586 13.3305 24.1701C13.1184 24.0816 12.9259 23.9519 12.7642 23.7886L3.67509 14.6995C3.04423 14.0703 2.54833 13.3191 2.21772 12.4917C1.88712 11.6643 1.72874 10.7782 1.75229 9.88753C1.77583 8.99686 1.98081 8.12035 2.35467 7.3116C2.72853 6.50284 3.26343 5.77885 3.92665 5.18388C6.47509 2.87607 10.6313 3.09482 13.1798 5.65419L14.0001 6.46357L15.0501 5.4245C15.6798 4.79711 16.4296 4.30325 17.2546 3.97248C18.0797 3.64171 18.963 3.48084 19.8517 3.4995C20.7444 3.52128 21.6232 3.72563 22.4339 4.09996C23.2447 4.4743 23.9702 5.01068 24.5657 5.67607C26.8626 8.2245 26.6548 12.3808 24.0954 14.9292Z" fill={isFavorited ? "#CD3625" : "#C6CED2"}/>
        </svg>
      </button>
    </div>
  );
}

export default function PaymentTipsPage() {
  const [favoritedTips, setFavoritedTips] = useState<Set<number>>(new Set());

  const toggleFavorite = (index: number) => {
    setFavoritedTips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-30 bg-white shadow border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-[1400px] mx-auto gap-2 sm:gap-0">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              <Image src="/images/logo.png" alt="Logo" width={56} height={56} className="w-full h-full object-cover" />
            </div>
          </div>
          {/* Title */}
          <div className="text-[20px] sm:text-[24px] lg:text-[36px] font-bold flex items-center justify-center text-center" style={{fontFamily: 'Playfair Display'}}>
            <span className="text-[#CD3625]">FOOD</span>
            <span className="text-black">DELY</span>
            <span className="text-black font-serif ml-1 sm:ml-2 text-xs sm:text-sm lg:text-base">Manager</span>
          </div>
          {/* Buttons */}
          <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-0">
            <button className="border border-gray-300 rounded-full px-3 py-1.5 sm:px-4 lg:px-5 sm:py-2 text-[12px] sm:text-[14px] lg:text-[16px] font-medium text-black hover:bg-gray-100 transition">Help (Call)</button>
            <button className="border border-gray-300 rounded-full px-3 py-1.5 sm:px-4 lg:px-5 sm:py-2 text-[12px] sm:text-[14px] lg:text-[16px] font-medium text-black hover:bg-gray-100 transition">Disconnect</button>
          </div>
        </div>
      </div>
      {/* Tabs and Content */}
      <div className="pt-[80px] sm:pt-[88px] lg:pt-[104px] bg-white min-h-screen max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 px-4 sm:px-8 lg:px-16 mt-4 sm:mt-6 lg:mt-8 mb-4 sm:mb-6 lg:mb-8 items-center">
          <button className="px-4 py-1.5 sm:px-6 lg:px-8 sm:py-2 rounded-full border-2 border-[#CD3625] text-[#CD3625] font-medium text-sm sm:text-base lg:text-lg bg-white">Paiements</button>
          <div className="h-4 sm:h-5 lg:h-6 border-l border-gray-300 mx-1 sm:mx-2" />
          <button className="px-4 py-1.5 sm:px-6 lg:px-8 sm:py-2 rounded-full bg-[#CD3625] text-white font-medium text-sm sm:text-base lg:text-lg shadow">Pourboires</button>
        </div>
        <hr className="mb-4 sm:mb-6 lg:mb-8" />
        <div className="px-4 sm:px-8 lg:px-12">
          <div className="text-xl sm:text-2xl font-bold mb-1 text-black">Payment Tips</div>
          <div className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Maximize your savings & secure Payments</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {paymentTips.map((tip, idx) => (
              <TipCard 
                key={idx} 
                {...tip} 
                isFavorited={favoritedTips.has(idx)}
                onToggleFavorite={() => toggleFavorite(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 