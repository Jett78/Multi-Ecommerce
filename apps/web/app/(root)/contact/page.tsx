import { getPageSeoForMetadata } from "@/actions/page-seo-action";
import type { Metadata } from "next";
import ContactInfo from "./contact-info";
import ContactForm from "./contact-form";
import { getCompanyProfile } from "@/actions/company-profile-action";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeoForMetadata("/contact");

  return {
    title: seo?.metaTitle ?? "Contact Us",
    description: seo?.metaDescription ?? "",
    openGraph: {
      title: seo?.ogTitle ?? seo?.metaTitle ?? "Contact Us",
      description: seo?.ogDescription ?? seo?.metaDescription ?? "",
      images: seo?.ogImageKey ? [{ url: seo.ogImageKey }] : [],
    },
  };
}

const ContactPage = async () => {
  let companyInfo = null;

  try {
    const data = await getCompanyProfile();
    if (data) {
      companyInfo = {
        ...data,
        createdAt: data.createdAt?.toString() || "",
        updatedAt: data.updatedAt?.toString() || "",
      };
    }
  } catch (error) {
    console.error("Error fetching company profile:", error);
    companyInfo = null;
  }

  return (
    <div className="bg-gray-50 pt-20">
      <section className="mx-auto max-w-7xl px-4 py-14 md:py-20 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 p-5 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Send us a Message
              </h3>
              <ContactForm />
            </div>
          </div>
          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-900 p-5 text-white">
              <ContactInfo companyInfo={companyInfo} />
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      {companyInfo?.googleMap && (
        <section className="w-full">
          <iframe
            src={
              companyInfo.googleMap.includes("src=")
                ? companyInfo.googleMap.match(/src="([^"]+)"/)?.[1]
                : companyInfo.googleMap
            }
            loading="lazy"
            className="w-full h-[400px] border-t border-gray-200"
          ></iframe>
        </section>
      )}
    </div>
  );
};

export default ContactPage;
