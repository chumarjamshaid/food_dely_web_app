"use client";
import Link from "next/link";
import "@fontsource/abril-fatface";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black bg-opacity-40 backdrop-blur-sm border-b border-gray-600">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <div
                className="text-[24px] font-extrabold"
                style={{ fontFamily: "Abril Fatface, serif" }}
              >
                <span className="text-red-600">FOOD</span>
                <span className="text-white">DELY</span>
              </div>
            </Link>
            <Link 
              href="/signup" 
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              ← Back to Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 border border-gray-600">
          <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-300">
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-300 font-medium">
                ⚠️ This page is under construction. The complete Privacy Policy will be available soon.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support. This may include your name, email address, phone number, delivery address, and payment information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, process your orders, communicate with you, and personalize your experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Information Sharing</h2>
              <p className="leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content and advertisements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Marketing Communications</h2>
              <p className="leading-relaxed">
                With your consent, we may send you promotional emails about our services, special offers, and updates. You can opt out of these communications at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
              <p className="leading-relaxed">
                You have the right to access, update, or delete your personal information. You may also request that we restrict or stop processing your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this privacy policy or our data practices, please contact us at privacy@fooddely.com.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 