import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Our terms of service govern your use of our website and services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">By accessing and using this website, you accept and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Use of Services</h2>
          <p className="mb-4">You must be at least 18 years old to use our services. You agree to provide accurate and complete information when registering or placing orders. You are responsible for maintaining the confidentiality of your account credentials.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Orders and Payments</h2>
          <p className="mb-4">All orders are subject to availability and confirmation. Prices are subject to change without notice. We accept various payment methods as displayed at checkout. Payment must be received in full before orders are processed.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Shipping and Delivery</h2>
          <p className="mb-4">We strive to deliver orders within the estimated timeframes. However, delivery times are estimates only and not guaranteed. Risk of loss transfers to you upon delivery.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Returns and Refunds</h2>
          <p className="mb-4">We accept returns within 7 days of delivery for eligible items. Items must be in original condition with tags attached. Refunds are issued to the original payment method. Shipping costs are non-refundable unless the return is due to our error.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
          <p className="mb-4">All content on this website, including text, graphics, logos, images, and software, is our property or licensed to us and protected by copyright laws. You may not reproduce, distribute, or create derivative works without permission.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Limitation of Liability</h2>
          <p className="mb-4">We are not liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount paid by you for the relevant order.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Governing Law</h2>
          <p className="mb-4">These terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Nepal.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to Terms</h2>
          <p className="mb-4">We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
          <p className="mb-4">If you have any questions about these Terms of Service, please contact us at:</p>
          <p className="mb-4">Email: legal@example.com</p>
          <p>Phone: +977-01-4XXXXXX</p>
        </div>
      </div>
    </div>
  );
}