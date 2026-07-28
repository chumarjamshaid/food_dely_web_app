import Image from "next/image";
import Link from "next/link";

export default function Page() {
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
            <button className="border border-gray-300 rounded-full px-3 py-1.5 sm:px-4 lg:px-5 sm:py-2 text-[12px] sm:text-[14px] lg:text-[16px] font-medium text-black hover:bg-gray-100 transition">
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
        <div className="flex items-center justify-between overflow-x-auto pb-2 w-full gap-2 scrollbar-hide">
          <Link
            href="/address"
            className={
              "px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150 bg-white text-black border-[#CD3625]"
            }
          >
            Restaurant
          </Link>
          <div className="h-6 border-l border-[#CD3625] mx-2 hidden md:block" />
          <Link
            href="/address"
            className="bg-[#CD3625] text-white px-6 py-2 rounded-full cursor-pointer font-normal text-base whitespace-nowrap shadow-sm border transition-all duration-150"
          >
            Delivery zones
          </Link>
        </div>
        <hr className="mb-8" />
        <main className="bg-white max-w-[1400px] mx-auto flex justify-center items-center flex-col lg:flex-row gap-8 pb-16">
          {/* Left Panel */}
          <div className="flex flex-col justify-center items-center gap-6 w-full max-w-[400px] mt-4">
            <h2 className="text-[28px] font-medium text-black mb-2 text-center lg:text-left">
              Zone List Panel
            </h2>
            {/* Delivered Card */}
            <div className="rounded-2xl bg-white shadow-lg p-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src="/images/chezmamma/map.png"
                  alt="Map"
                  className="w-[24px] h-[32px] object-contain rounded-xl"
                  width={24}
                  height={32}
                />
                <div>
                  <div className="text-lg font-semibold text-black">
                    10th pleasure street
                  </div>
                  <div className="text-[#8F8F8F] text-base">Montreux, VD</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <div className="text-base font-medium text-black">
                    Order ID
                  </div>
                  <div className="text-[#8F8F8F] text-base">#AR123456</div>
                </div>
                <div className="text-2xl font-semibold text-black">$70.80</div>
              </div>
              <div className="flex items-center justify-between gap-4 mt-6">
                <button className="border border-[#CACACA] rounded-full px-6 py-2 text-lg font-medium text-black bg-white hover:bg-gray-100 transition">
                  View Orders
                </button>
                <span className="border border-[#22C55E] text-[#22C55E] bg-white rounded-full px-6 py-2 text-lg font-medium">
                  Delivered
                </span>
              </div>
            </div>
            {/* Pending Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#F98443] to-[#F84775] shadow-lg p-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src="/images/mapwhite.png"
                  alt="Map"
                  className="w-[24px] h-[32px] object-contain rounded-xl"
                  width={24}
                  height={32}
                />
                <div>
                  <div className="text-lg font-semibold text-white">
                    10th pleasure street
                  </div>
                  <div className="text-white/80 text-base">Montreux, VD</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <div className="text-base font-medium text-white">
                    Order ID
                  </div>
                  <div className="text-white/80 text-base">#AR123456</div>
                </div>
                <div className="text-2xl font-semibold text-white">$70.80</div>
              </div>
              <div className="flex items-center justify-between gap-4 mt-6">
                <button className="border border-white rounded-full px-6 py-2 text-lg font-medium text-white bg-transparent hover:bg-white/10 transition">
                  View Orders
                </button>
                <span className="bg-white text-[#F8AD0C] rounded-full px-6 py-2 text-lg font-medium">
                  Pending
                </span>
              </div>
            </div>
            <button className="mt-8 bg-[#CD3625] text-white rounded-full px-10 py-4 text-xl font-semibold shadow-lg hover:bg-[#b82d1e] transition">
              Add New Zone
            </button>
          </div>
          {/* Map Panel */}
          <div className="flex-1 flex items-center justify-center ml-12">
            <Image
              src="/images/zonemap.png"
              alt="Map"
              width={900}
              height={700}
              className="w-full h-[700px] object-cover"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
