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
      <div className="pt-[170px] sm:pt-[104px] bg-white min-h-screen max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="flex px-8 py-4 items-center justify-between overflow-x-auto pb-2 w-full gap-2 scrollbar-hide">
          <button className="px-8 py-2 rounded-full border-2 border-[#CD3625] text-black font-medium md:text-lg bg-white">
            Restaurant
          </button>
          <div className="h-6 border-l border-[#CD3625] mx-2 hidden sm:block" />
          <button className="px-8 py-2 rounded-full bg-[#CD3625] text-white font-medium whitespace-nowrap md:text-lg shadow">
            Information de contact
          </button>
        </div>
        <hr className="mb-8" />
        <main className="bg-white max-w-[1400px] mx-auto px-8 py-4 flex flex-col items-center pb-16">
          <div className="w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between mt-8">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-8 px-4 py-2 min-w-[300px] overflow-auto">
              {/* Logo and Rating */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                <span
                  className="text-[36px] font-normal select-none"
                  style={{ fontFamily: "Abril Fatface, serif" }}
                >
                  <span className="text-[#CD3625]">FOOD</span>
                  <span className="text-black">DELY</span>
                </span>
                <span className="flex items-center text-lg font-semibold text-blue-900 ml-2">
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="text-yellow-400 mr-1"
                  >
                    <path
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                      fill="#F8AD0C"
                    />
                  </svg>
                  <span className="text-[#07143B] font-semibold text-[20px] ml-1">
                    4.5
                  </span>
                  <span className="text-[#8F8F8F] text-[18px] ml-2">
                    (100+ ratings)
                  </span>
                </span>
              </div>
              {/* Address */}
              <div>
                <h2 className="text-[28px] font-medium text-black mb-2">
                  Address
                </h2>
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/chezmamma/map.png"
                    alt="Map"
                    className="w-[24px] h-[32px] object-contain rounded-xl"
                    width={24}
                    height={32}
                  />
                  <div className="flex flex-col">
                    <span className="text-[#F97252] text-lg font-normal">
                      Rue du sacre du Printemps 11A
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className="text-black">1815</span>
                      <span className="text-[#F97252] text-lg font-normal">
                        Montreux
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Contact Detail */}
              <div>
                <h2 className="text-[28px] font-medium text-black mb-2 mt-4">
                  Contact Detail
                </h2>
                <div className="flex items-center gap-3 mb-2 mt-2">
                  <Image
                    src="/images/chezmamma/call.png"
                    alt="Map"
                    className="w-[24px] h-[22px] object-contain"
                    width={24}
                    height={22}
                  />
                  <span className="text-black text-lg">(41) 21.469.69.69</span>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <Image
                    src="/images/email.png"
                    alt="Map"
                    className="w-[24px] h-[22px] object-contain"
                    width={24}
                    height={22}
                  />
                  <span className="text-black text-lg">
                    cotact@Fooddely.com
                  </span>
                </div>
              </div>
              {/* Social Media Links */}
              <div className="mt-6">
                <h2 className="text-[28px] font-semibold text-black mb-2">
                  Social Media Links
                </h2>
                <div className="flex gap-4 mt-2">
                  <Image
                    src="/images/facebook.png"
                    alt="Map"
                    className="w-[67px] h-[64px] object-contain"
                    width={67}
                    height={64}
                  />
                  <Image
                    src="/images/twitter.png"
                    alt="Map"
                    className="w-[67px] h-[64px] object-contain"
                    width={67}
                    height={64}
                  />
                  <Image
                    src="/images/google.png"
                    alt="Map"
                    className="w-[67px] h-[64px] object-contain"
                    width={67}
                    height={64}
                  />
                </div>
              </div>
            </div>
            {/* Right Column: Contact Form */}
            <div className="flex-1 flex justify-center">
              <form className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-xl flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="flex-1 border border-[#E0E0E0] rounded-lg px-4 py-3 text-[#F97252] text-lg focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="email@gmail.com"
                    className="flex-1 border border-[#E0E0E0] rounded-lg px-4 py-3 text-[#F97252] text-lg focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Your Subject"
                  className="border border-[#E0E0E0] rounded-lg px-4 py-3 text-[#F97252] text-lg focus:outline-none"
                />
                <textarea
                  placeholder="Your Message"
                  className="border border-[#E0E0E0] rounded-lg px-4 py-3 text-[#F97252] text-lg focus:outline-none min-h-[120px]"
                />
                <div className="flex justify-center mt-2">
                  <button
                    type="submit"
                    className="bg-[#CD3625] text-white rounded-full px-10 py-3 text-lg font-semibold shadow-lg hover:bg-[#b82d1e] transition"
                  >
                    Book A Table
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* Update Information Button */}
          <div className="w-full flex justify-center mt-12">
            <Link
              href="/"
              className="bg-[#CD3625] text-white rounded-full px-14 py-4 text-xl font-semibold shadow-lg hover:bg-[#b82d1e] transition"
            >
              Update Information
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
