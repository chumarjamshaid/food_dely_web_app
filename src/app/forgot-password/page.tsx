"use client";
import Link from "next/link";
import { useState } from "react";
import "@fontsource/abril-fatface";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement actual password reset functionality
    // For now, simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="text-[32px] font-extrabold mb-2"
            style={{ fontFamily: "Abril Fatface, serif" }}
          >
            <span className="text-red-600">FOOD</span>
            <span className="text-white">DELY</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-300">
            {isSubmitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive reset instructions"
            }
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 border border-gray-600">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-full bg-black bg-opacity-40 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#CD3625] text-white py-3 rounded-full font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Sent!</h3>
                <p className="text-gray-300 text-sm">
                  We&apos;ve sent password reset instructions to <span className="text-white">{email}</span>
                </p>
              </div>
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-gray-600 text-white py-3 rounded-full font-semibold hover:bg-gray-700 transition"
              >
                Send to Different Email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Remember your password?{" "}
              <Link href="/signin" className="text-red-400 hover:text-red-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 