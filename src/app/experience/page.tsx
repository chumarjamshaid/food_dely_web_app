"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [dateFilter, setDateFilter] = useState("");
  const [latest, setLatest] = useState("");
  const [allRating, setAllRating] = useState("");

  return (
    <div className="bg-white">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full z-30 bg-white shadow border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between justify-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-[1400px] mx-auto gap-2 sm:gap-0">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Title */}
          <div
            className="text-[20px] sm:text-[24px] lg:text-[36px] font-bold flex items-center justify-center text-center"
            style={{ fontFamily: "Playfair Display" }}
          >
            <span className="text-[#CD3625]">FOOD</span>
            <span className="text-black">DELY</span>
            <span className="text-black font-serif ml-1 sm:ml-2 text-xs sm:text-sm lg:text-base">
              Manager
            </span>
          </div>
          {/* Buttons */}
          <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-0">
            <button className="border border-gray-300 rounded-full px-3 py-1.5 sm:px-4 lg:px-5 sm:py-2 text-[10px] sm:text-[14px] lg:text-[16px] font-medium text-black hover:bg-gray-100 transition">
              Help (Call)
            </button>
            <button className="border border-gray-300 rounded-full px-3 py-1.5 sm:px-4 lg:px-5 sm:py-2 text-[12px] sm:text-[14px] lg:text-[16px] font-medium text-black hover:bg-gray-100 transition">
              Disconnect
            </button>
          </div>
        </div>
      </div>
      {/* Tabs and Content */}
      <div className="pt-[170px] sm:pt-[104px] px-8 bg-white min-h-screen max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="flex px-8 py-4 items-center justify-between overflow-x-auto pb-2 w-full gap-2 scrollbar-hide">
          <Link
            href="/payment"
            className="border-[#CD3625] text-black px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150"
          >
            Statistiques
          </Link>
          <div className="h-6 border-l border-[#CD3625] mx-2 hidden sm:block" />
          <Link
            href="/payment"
            className="bg-[#CD3625] text-white px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150"
          >
            Expérience client
          </Link>
        </div>
        <hr className="mb-8" />
        <main className="bg-white max-w-[1400px] mx-auto pb-16">
          {/* Top Buttons */}
          <div className="flex px-8 py-4 items-center justify-between overflow-x-auto pb-2 w-full gap-2 scrollbar-hide">
            <button className="bg-[#CD3625] text-white px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150">
              View All feedbacks
            </button>
            <button className="bg-[#CD3625] text-white px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150">
              Export Report
            </button>
          </div>

          {/* Clients Experience Summary */}
          <h2 className="text-[28px] font-semibold text-black mb-4">
            Clients Experience Summary
          </h2>
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow p-8 mb-10 w-full flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Chart and Legend */}
            <div className="flex-1 w-full md:min-w-[400px]">
              <div className="w-full h-full md:h-[390px] flex items-center justify-center">
                <Image
                  src="/images/exprience.png"
                  alt="Chart"
                  width={1200}
                  height={390}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            {/* Stats and Legend */}
            <div className=" bg-white p-6 flex flex-col gap-6">
              {/* Dropdown */}
              <div className="flex justify-start">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[170px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                    <SelectValue placeholder="This Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Legends */}
              <div className="flex gap-6 items-center text-sm font-medium text-[#A29DB1]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-[#F8B602]"></span>
                  Positive
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-[#F93535]"></span>
                  Bad
                </div>
              </div>

              {/* Positive Feedback */}
              <div className="mt-3">
                <p className="text-base font-medium text-[#232323] mb-1">
                  Positive Feedback
                </p>
                <p className="text-3xl font-extrabold text-[#232323]">3.456%</p>
                <div className="flex items-center gap-2 mt-2 ml-1">
                  <Image
                    src="/images/uparrow1.png"
                    alt="Logo"
                    width={24}
                    height={24}
                  />
                  <span className="text-[#F8B602] font-semibold text-sm">
                    +15%
                  </span>
                  <span className="text-[#A29DB1] text-sm">
                    From last month
                  </span>
                </div>
              </div>

              {/* Divider */}

              {/* Bad Feedback */}
              <div>
                <p className="text-base font-medium text-[#232323] mb-1">
                  Bad Feedback
                </p>
                <p className="text-3xl font-extrabold text-[#232323]">1.236%</p>
                <div className="flex items-center gap-2 mt-2 ml-1">
                  <Image
                    src="/images/downarrow1.png"
                    alt="Logo"
                    width={24}
                    height={24}
                  />
                  <span className="text-[#F93535] font-semibold text-sm">
                    +15%
                  </span>
                  <span className="text-[#A29DB1] text-sm">
                    From last month
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Feedback Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 w-full">
            <h2 className="text-[24px] font-semibold text-black">
              Recent Feedback
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={latest} onValueChange={setLatest}>
                <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[170px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                  <SelectValue placeholder="Latest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Latest</SelectItem>
                </SelectContent>
              </Select>
              <Select value={allRating} onValueChange={setAllRating}>
                <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[170px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Feedback Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E0E0E0] shadow p-8 flex flex-col gap-4 min-h-[200px]"
              >
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        fill="#F8B602"
                      />
                    </svg>
                  ))}
                </div>
                <div className="font-semibold text-[16px] text-black mb-1">
                  Lorem ipsum dolor sit amet.
                </div>
                <div className="text-[#8F8F8F] text-base mb-2">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
                  do eiusmod tempor.
                </div>
                <div className="flex items-center gap-3 mt-auto">
                  <Image
                    src={`/images/client${(i % 4) + 1}.png`}
                    alt="Client"
                    width={40}
                    height={40}
                    className="rounded-xl object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-[#232323]">
                      {
                        [
                          "Ruby Roben",
                          "Jack Jock",
                          "Danny Ahmad",
                          "Ruby Roben",
                          "Jack Jock",
                          "Danny Ahmad",
                        ][i - 1]
                      }
                    </span>
                    <span className="text-xs text-[#8F8F8F]">
                      Ordered June 21, 2020
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
