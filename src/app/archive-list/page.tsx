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
import { useEffect, useState } from "react";

const initialData = Array.from({ length: 10 }).map((_, i) => ({
  id: `#ER8478${i + 1}`,
  date: "20 mar 2025",
  status: i % 2 === 0 ? "Completed" : "Pending",
  payment: i % 2 === 0 ? "Success" : "Pending",
  total: i % 2 === 0 ? 850 : 150,
}));

export default function Page() {
  const [dateFilter, setDateFilter] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentType, setPaymentType] = useState("all");
  const [data, setData] = useState(initialData);

  const filteredData = data.filter((item) => {
    const statusMatch = status === "all" || item.status === status;
    const paymentMatch = paymentType === "all" || item.payment === paymentType;
    return statusMatch && paymentMatch;
  });

  useEffect(() => {
    setData(initialData);
  }, []);

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
          <button className="bg-[#CD3625] text-white px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150">
            Paiements
          </button>
          <div className="h-6 border-l border-[#CD3625] mx-2" />
          <Link
            href="/discounts"
            className={
              "px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 bg-white text-black border-gray-50"
            }
          >
            Facturations
          </Link>
          <Link
            href="/discounts"
            className={
              "px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 bg-white text-black border-gray-50"
            }
          >
            Paiements en ligne
          </Link>
          <Link
            href="/discounts"
            className={
              "px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 bg-white text-black border-gray-50"
            }
          >
            Archives des commandes
          </Link>
          <Link
            href="/discounts"
            className={
              "px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 bg-white text-black border-gray-50"
            }
          >
            Pourboires
          </Link>
        </div>
        <hr className="mb-8" />
        <main className="bg-white px-1 md:px-8 py-4 max-w-[1400px] mx-auto pb-16">
          <div className="w-full flex justify-center items-center">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 w-full justify-center">
              <div className="flex overflow-x-auto scrollbar-hide items-center gap-4 flex-1">
                <div className="relative w-[260px]">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full rounded-full bg-[#F3F6FF] px-12 py-3 text-lg text-[#434A5E] border-none focus:outline-none"
                  />
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F93535]"
                    width="22"
                    height="22"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="#F97252"
                      strokeWidth="2"
                    />
                    <path
                      stroke="#F97252"
                      strokeWidth="2"
                      strokeLinecap="round"
                      d="M21 21l-3.5-3.5"
                    />
                  </svg>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[170px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Date Range</SelectItem>
                    <SelectItem value="25">25 mar 2025</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[140px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="w-[100px] sm:w-[120px] lg:w-[190px] px-3 py-6 bg-white border border-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-lg">
                    <SelectValue placeholder="Payment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Payment Type</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 w-full">
            <h2 className="text-[28px] font-medium text-black">Archive List</h2>
            <div className="flex gap-4">
              <button className="bg-[#CD3625] text-white rounded-full px-10 py-3 text-lg font-semibold shadow-lg hover:bg-[#b82d1e] transition">
                Export Archive List
              </button>
            </div>
          </div>
          {/* Top Bar */}

          {/* Table */}
          <div className="rounded-2xl bg-[#FAFAFA] shadow-lg overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-[#E5E5E5] text-[#7B7B7B] text-lg font-medium">
                  <th className="px-6 py-4 font-medium rounded-tl-2xl">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#CD3625]"
                    />
                  </th>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Delivery</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium rounded-tr-2xl">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-[#232323] text-lg">
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b border-[#F0F0F0] last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#CD3625]"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">{item.id}</td>
                    <td className="px-6 py-4 font-medium">{item.date}</td>
                    <td className="px-6 py-4 font-medium">
                      <span
                        className={
                          item.status === "Completed"
                            ? "text-[#F93535]"
                            : "text-[#F8B602]"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">${item.total}</td>
                    <td className="px-6 py-4 font-medium">
                      <span
                        className={
                          item.payment === "Success"
                            ? "text-[#F93535]"
                            : "text-[#F8B602]"
                        }
                      >
                        {item.payment}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <button className="flex items-center justify-center w-8 h-8">
                        <svg
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="5" r="2" fill="#232323" />
                          <circle cx="12" cy="12" r="2" fill="#232323" />
                          <circle cx="12" cy="19" r="2" fill="#232323" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
