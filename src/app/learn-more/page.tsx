"use client";
import Link from "next/link";

export default function LearnMorePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/anti-waste"
              className="flex items-center gap-2 text-[#CD3625] hover:text-red-700 transition-colors"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium text-[16px]">Back</span>
            </Link>
          </div>
          
          <div
            className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold"
            style={{ fontFamily: "Abril Fatface, serif" }}
          >
            <span className="text-[#CD3625]">FOOD</span>
            <span className="text-black">DELY</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold text-black mb-4">
              Understanding Anti-Waste Initiatives
            </h1>
            <p className="text-[#8F8F8F] text-[16px] sm:text-[18px] leading-relaxed">
              Learn how we&apos;re working together to reduce food waste and create a more sustainable future
            </p>
          </div>

          <div className="space-y-8">
            {/* Section 1 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-[24px] sm:text-[26px] font-bold text-black mb-4">
                What is Anti-Waste?
              </h2>
              <p className="text-[#8F8F8F] text-[16px] leading-relaxed mb-4">
                Anti-waste initiatives are comprehensive programs designed to minimize food waste throughout the entire supply chain. 
                From farm to table, we implement strategies that help reduce the environmental impact of food production and consumption.
              </p>
              <p className="text-[#8F8F8F] text-[16px] leading-relaxed">
                Our platform connects restaurants with customers who are willing to purchase surplus food at discounted prices, 
                ensuring that perfectly good food doesn&apos;t end up in landfills while providing affordable meals to our community.
              </p>
            </div>

            {/* Section 2 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-[24px] sm:text-[26px] font-bold text-black mb-4">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#CD3625] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-[20px]">1</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-black mb-2">Restaurants List Surplus</h3>
                  <p className="text-[#8F8F8F] text-[14px] leading-relaxed">
                    Partner restaurants identify surplus food items and list them on our platform at reduced prices.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#CD3625] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-[20px]">2</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-black mb-2">Customers Order</h3>
                  <p className="text-[#8F8F8F] text-[14px] leading-relaxed">
                    Customers browse available items and place orders for discounted meals through our app.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#CD3625] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-[20px]">3</span>
                  </div>
                  <h3 className="text-[18px] font-semibold text-black mb-2">Food is Saved</h3>
                  <p className="text-[#8F8F8F] text-[14px] leading-relaxed">
                    Surplus food is delivered to customers, preventing waste while providing affordable meals.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-[24px] sm:text-[26px] font-bold text-black mb-4">
                Environmental Impact
              </h2>
              <p className="text-[#8F8F8F] text-[16px] leading-relaxed mb-4">
                Food waste is a significant contributor to greenhouse gas emissions. When food decomposes in landfills, 
                it produces methane, a potent greenhouse gas that contributes to climate change.
              </p>
              <p className="text-[#8F8F8F] text-[16px] leading-relaxed mb-4">
                By participating in our anti-waste program, you&apos;re helping to:
              </p>
              <ul className="list-disc list-inside text-[#8F8F8F] text-[16px] leading-relaxed space-y-2 ml-4">
                <li>Reduce methane emissions from landfills</li>
                <li>Conserve water and energy used in food production</li>
                <li>Minimize the carbon footprint of food transportation</li>
                <li>Support sustainable food systems</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-[24px] sm:text-[26px] font-bold text-black mb-4">
                Economic Benefits
              </h2>
              <p className="text-[#8F8F8F] text-[16px] leading-relaxed mb-4">
                Our anti-waste program creates a win-win situation for everyone involved:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-[18px] font-semibold text-black mb-3">For Restaurants</h3>
                  <ul className="text-[#8F8F8F] text-[14px] space-y-2">
                    <li>• Recover costs on surplus inventory</li>
                    <li>• Reduce waste disposal expenses</li>
                    <li>• Attract new customers</li>
                    <li>• Enhance brand reputation</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-[18px] font-semibold text-black mb-3">For Customers</h3>
                  <ul className="text-[#8F8F8F] text-[14px] space-y-2">
                    <li>• Access quality food at discounted prices</li>
                    <li>• Try new restaurants affordably</li>
                    <li>• Contribute to environmental sustainability</li>
                    <li>• Support local businesses</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="text-[24px] sm:text-[26px] font-bold text-black mb-4">
                Join Our Mission
              </h2>
              <p className="text-[#8F8F8F] text-[16px] leading-relaxed mb-6">
                Every meal saved from waste makes a difference. Whether you&apos;re a restaurant looking to reduce waste 
                or a customer wanting to make sustainable choices, our platform makes it easy to participate in 
                the fight against food waste.
              </p>
              <div className="text-center">
                <Link
                  href="/anti-waste"
                  className="inline-flex items-center gap-2 bg-[#CD3625] text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors text-[16px]"
                >
                  Start Saving Food Today
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 