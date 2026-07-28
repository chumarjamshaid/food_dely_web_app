"use client";
import { useState } from "react";

interface LoyaltyCardProps {
  points: number;
  mealsOrdered: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  memberSince: string;
}

export default function LoyaltyCard({ 
  points, 
  mealsOrdered, 
  tier, 
  memberSince 
}: LoyaltyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "from-amber-600 to-amber-800";
      case "Silver":
        return "from-gray-400 to-gray-600";
      case "Gold":
        return "from-yellow-400 to-yellow-600";
      case "Platinum":
        return "from-purple-400 to-purple-600";
      default:
        return "from-amber-600 to-amber-800";
    }
  };

  const getNextTier = (currentTier: string) => {
    switch (currentTier) {
      case "Bronze":
        return { tier: "Silver", pointsNeeded: 1000 - points };
      case "Silver":
        return { tier: "Gold", pointsNeeded: 2500 - points };
      case "Gold":
        return { tier: "Platinum", pointsNeeded: 5000 - points };
      case "Platinum":
        return { tier: "Platinum", pointsNeeded: 0 };
      default:
        return { tier: "Silver", pointsNeeded: 1000 - points };
    }
  };

  const nextTier = getNextTier(tier);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div 
        className={`relative w-full h-56 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <div className={`absolute w-full h-full rounded-2xl bg-gradient-to-br ${getTierColor(tier)} p-6 text-white shadow-2xl backface-hidden`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">FOOD DELY</h3>
              <p className="text-sm opacity-80">Loyalty Card</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{points}</div>
              <div className="text-xs opacity-80">POINTS</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-3xl font-bold mb-1">{tier}</div>
            <div className="text-sm opacity-80">MEMBER</div>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm opacity-80">Member Since</div>
              <div className="font-semibold">{memberSince}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">Meals Ordered</div>
              <div className="font-semibold">{mealsOrdered}</div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 text-xs opacity-60">
            Tap to flip
          </div>
        </div>

        {/* Back of card */}
        <div className={`absolute w-full h-full rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-6 text-white shadow-2xl backface-hidden rotate-y-180`}>
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold mb-2">Rewards Progress</h3>
            <div className="text-3xl font-bold text-red-400 mb-1">{points}</div>
            <div className="text-sm opacity-80">Current Points</div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Next Tier: {nextTier.tier}</span>
              <span>{nextTier.pointsNeeded > 0 ? `${nextTier.pointsNeeded} more` : 'Max tier!'}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getTierColor(nextTier.tier)}`}
                style={{ 
                  width: `${nextTier.pointsNeeded > 0 ? Math.min(100, ((points / (points + nextTier.pointsNeeded)) * 100)) : 100}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Free Delivery</span>
              <span className={points >= 500 ? 'text-green-400' : 'text-gray-400'}>
                {points >= 500 ? '✓' : '500 pts'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>10% Discount</span>
              <span className={points >= 1000 ? 'text-green-400' : 'text-gray-400'}>
                {points >= 1000 ? '✓' : '1000 pts'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Free Dessert</span>
              <span className={points >= 2000 ? 'text-green-400' : 'text-gray-400'}>
                {points >= 2000 ? '✓' : '2000 pts'}
              </span>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 text-xs opacity-60">
            Tap to flip back
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Earn 10 points per $1 spent
        </p>
      </div>
    </div>
  );
} 