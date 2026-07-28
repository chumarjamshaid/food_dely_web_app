"use client";
import Link from "next/link";
import "@fontsource/abril-fatface";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-300">
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-300 font-medium">
                ⚠️ This page is under construction. The complete Terms of Service will be available soon.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using FoodDely, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Use License</h2>
              <p className="leading-relaxed">
                Permission is granted to temporarily download one copy of the materials (information or software) on FoodDely&apos;s website for personal, non-commercial transitory viewing only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Disclaimer</h2>
              <p className="leading-relaxed">
                The materials on FoodDely&apos;s website are provided on an &apos;as is&apos; basis. FoodDely makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Limitations</h2>
              <p className="leading-relaxed">
                In no event shall FoodDely or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on FoodDely&apos;s website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Revisions and Errata</h2>
              <p className="leading-relaxed">
                The materials appearing on FoodDely&apos;s website could include technical, typographical, or photographic errors. FoodDely does not warrant that any of the materials on its website are accurate, complete or current.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Links</h2>
              <p className="leading-relaxed">
                FoodDely has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by FoodDely of the site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Modifications</h2>
              <p className="leading-relaxed">
                FoodDely may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Governing Law</h2>
              <p className="leading-relaxed">
                Any claim relating to FoodDely&apos;s website shall be governed by the laws of the jurisdiction in which FoodDely operates without regard to its conflict of law provisions.
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