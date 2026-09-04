import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ThemeStyles } from "@/components/theme-styles";
import { getPublicSeoSettings } from "@/actions/seo-action";
import { getCompanyProfile } from "@/actions/company-profile-action";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const [seo, company] = await Promise.all([
    getPublicSeoSettings(),
    getCompanyProfile(),
  ]);

  const faviconUrl = company?.faviconKey || undefined;

  return {
    title: seo?.metaTitle ?? "",
    description: seo?.metaDescription ?? "",
    openGraph: {
      title: seo?.ogTitle ?? seo?.metaTitle ?? "",
      description: seo?.ogDescription ?? seo?.metaDescription ?? "",
      images: seo?.ogImageKey ? [{ url: seo.ogImageKey }] : [],
      type: "website",
    },
    verification: seo?.googleSearchConsoleVerification
      ? { google: seo.googleSearchConsoleVerification }
      : undefined,
    icons: {
      icon: faviconUrl ? [faviconUrl] : ["/favicon.svg"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getPublicSeoSettings();

  return (
    <html lang="en" className={cn("scroll-smooth", geist.variable)}>
      <body className="antialiased">
        {seo?.gtmContainerId && (
          <GoogleTagManager gtmId={seo.gtmContainerId} />
        )}

        {seo?.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');`}</Script>
          </>
        )}

        {seo?.microsoftClarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${seo.microsoftClarityId}");`}</Script>
        )}

        <QueryProvider>
          <ThemeStyles>
            <ThemeProvider>{children}</ThemeProvider>
          </ThemeStyles>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
