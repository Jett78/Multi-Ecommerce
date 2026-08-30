"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartIcon, dispatchOpenCart } from "@/components/cart/cart-icon";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import type { CompanyProfile } from "@/types/company-profile";

interface NavItem {
  key: string;
  label: string;
  path: string;
}

interface NavbarClientProps {
  company: CompanyProfile | null;
  navItems: NavItem[];
}

export function NavbarClient({ company, navItems }: NavbarClientProps) {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (isOpen) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isOpen]);

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
          showNavbar ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              {company?.logoKey ? (
                <Image
                  src={company.logoKey}
                  alt={company.companyName || "Logo"}
                  width={70}
                  height={70}
                  className="object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-secondarymain to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                  Logo
                </div>
              )}
            </Link>

            {/* Mobile logo text */}
            <span className="text-sm font-extrabold tracking-tight text-gray-900 sm:hidden">
              {company?.companyName || "Nextjs"}
            </span>

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Desktop nav */}
              <nav className="hidden items-center gap-2 md:flex">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "relative rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "text-secondarymain"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-secondarymain" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Cart Icon */}
              <CartIcon onClick={() => setCartOpen(true)} />

              {/* Hamburger */}
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                {isOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
            <span className="text-lg font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center rounded-xl px-4 py-3 text-base font-medium transition-all duration-200",
                      isActive
                        ? "bg-secondarymain/10 text-secondarymain"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Cart Link */}
          <div className="border-t border-gray-100 p-4">
            <button
              onClick={() => { setIsOpen(false); setCartOpen(true); }}
              className="flex w-full items-center rounded-xl px-4 py-3 text-base font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
              Cart
            </button>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
