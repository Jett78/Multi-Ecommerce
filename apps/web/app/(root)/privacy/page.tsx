import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Our privacy policy explains how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect information you provide directly to us, such as when you create an account, place an order, subscribe to our newsletter, or contact us for support. This may include your name, email address, phone number, shipping address, payment information, and order history.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to process orders, communicate with you about your account and orders, improve our services, send promotional emails (with your consent), and comply with legal obligations.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
          <p className="mb-4">We do not sell your personal information. We may share your information with third-party service providers who help us operate our business (e.g., payment processors, shipping carriers), or when required by law.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p className="mb-4">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p className="mb-4">You have the right to access, correct, or delete your personal information. You can also opt out of marketing communications at any time. To exercise these rights, please contact us.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Cookies</h2>
          <p className="mb-4">We use cookies and similar technologies to enhance your experience, analyze traffic, and personalize content. You can manage cookie preferences through your browser settings.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to This Policy</h2>
          <p className="mb-4">We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated effective date.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
          <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="mb-4">Email: privacy@example.com</p>
          <p>Phone: +977-01-4XXXXXX</p>
        </div>
      </div>
    </div>
  );
}