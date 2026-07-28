"use client";
import LoyaltyCard from "../../components/LoyaltyCard";

export default function LoyaltyDemo() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Loyalty Points System</h1>
          <p className="text-gray-300 text-lg">
            Digital loyalty cards to encourage repeat purchases
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Bronze Tier */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white text-center">Bronze Member</h3>
            <LoyaltyCard
              points={250}
              mealsOrdered={5}
              tier="Bronze"
              memberSince="Jan 2024"
            />
          </div>

          {/* Silver Tier */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white text-center">Silver Member</h3>
            <LoyaltyCard
              points={1200}
              mealsOrdered={12}
              tier="Silver"
              memberSince="Mar 2024"
            />
          </div>

          {/* Gold Tier */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white text-center">Gold Member</h3>
            <LoyaltyCard
              points={3200}
              mealsOrdered={32}
              tier="Gold"
              memberSince="Jun 2024"
            />
          </div>

          {/* Platinum Tier */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white text-center">Platinum Member</h3>
            <LoyaltyCard
              points={7500}
              mealsOrdered={75}
              tier="Platinum"
              memberSince="Sep 2024"
            />
          </div>
        </div>

        <div className="mt-16 bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 border border-gray-600">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Earn Points</h3>
              <p className="text-gray-300">Get 10 points for every $1 spent on food delivery</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Level Up</h3>
              <p className="text-gray-300">Unlock higher tiers with exclusive benefits and rewards</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Redeem Rewards</h3>
              <p className="text-gray-300">Use points for discounts, free delivery, and special offers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 