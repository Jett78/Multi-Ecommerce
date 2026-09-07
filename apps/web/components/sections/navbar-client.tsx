"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ShoppingCart, Heart, User, LogOut, Package, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartIcon, dispatchOpenCart } from "@/components/cart/cart-icon";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useWishlistStore } from "@/stores/wishlist-store";
import { WishlistSidebar } from "@/components/wishlist/wishlist-sidebar";
import { useSession, signOut } from "@/lib/auth-client";
import { useAuthModal } from "@/contexts/auth-modal-context";
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
  const router = useRouter();
  const [showNavbar, setShowNavbar] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlistOpen, setWishlistOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const wishlistItemCount = useWishlistStore((s) => s.items.length);
  const { data: session } = useSession() as any;
  const isAuthenticated = !!session?.user;
  const { openLogin } = useAuthModal();
  const userMenuRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    document.cookie = "user_role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    setUserMenuOpen(false);
    router.push("/");
  };

  const handleLoginClick = () => {
    openLogin(pathname);
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
          showNavbar ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              {company?.logoKey ? (
                <Image
                  src={company.logoKey}
                  alt={company.companyName || "Logo"}
                  width={60}
                  height={60}
                  className="object-contain"
                />
              ) : (
                <span className="text-lg font-bold tracking-tight text-gray-900">
                  {company?.companyName || "Store"}
                </span>
              )}
            </Link>

            {/* Mobile logo text */}
            <span className="text-sm font-bold tracking-tight text-gray-900 sm:hidden">
              {company?.companyName || "Store"}
            </span>

            {/* Right section */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "relative px-3 py-2 text-[13px] font-medium transition-colors",
                        isActive
                          ? "text-primarymain"
                          : "text-gray-500 hover:text-gray-900",
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-px bg-primarymain" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Wishlist Icon */}
              <button
                onClick={() => setWishlistOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
                aria-label={`Wishlist with ${wishlistItemCount} items`}
              >
                <Heart className="h-5 w-5" />
                {wishlistItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primarymain text-[10px] font-bold text-white">
                    {wishlistItemCount > 99 ? "99+" : wishlistItemCount}
                  </span>
                )}
              </button>

              {/* Cart Icon */}
              <CartIcon onClick={() => setCartOpen(true)} />

              {/* Auth Button */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{session.user.name}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", userMenuOpen && "rotate-180")} />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 border border-gray-200 bg-white py-1 shadow-lg z-50">
                      <Link
                        href="/profile/user"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/profile/user/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                      <Link
                        href="/profile/user/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Hamburger */}
              <button
                className="inline-flex h-9 w-9 items-center justify-center text-gray-600 transition-colors hover:text-gray-900 md:hidden"
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
          "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[80%] max-w-sm bg-white shadow-xl transition-transform duration-300 ease-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-gray-100 px-5">
            <span className="text-sm font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-0">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center border-b border-gray-50 px-0 py-3.5 text-[15px] font-medium transition-colors",
                      isActive
                        ? "text-primarymain"
                        : "text-gray-500 hover:text-gray-900",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Auth Section */}
          <div className="border-t border-gray-100 p-5 space-y-0">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-0 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                  </div>
                </div>
                <Link
                  href="/profile/user"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-0 py-3 text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                >
                  <User className="h-5 w-5" />
                  My Profile
                </Link>
                <Link
                  href="/profile/user/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-0 py-3 text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
                >
                  <Package className="h-5 w-5" />
                  My Orders
                </Link>
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="flex w-full items-center gap-3 px-0 py-3 text-[15px] font-medium text-red-600 transition-colors hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setIsOpen(false); handleLoginClick(); }}
                className="flex w-full items-center justify-center gap-2 bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                <User className="h-4 w-4" />
                Sign In
              </button>
            )}

            <button
              onClick={() => { setIsOpen(false); setWishlistOpen(true); }}
              className="flex w-full items-center gap-3 px-0 py-3 text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              <Heart className="h-5 w-5" />
              Wishlist
              {wishlistItemCount > 0 && (
                <span className="ml-auto text-[11px] text-gray-400">({wishlistItemCount})</span>
              )}
            </button>
            <button
              onClick={() => { setIsOpen(false); setCartOpen(true); }}
              className="flex w-full items-center gap-3 px-0 py-3 text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              <ShoppingCart className="h-5 w-5" />
              Cart
            </button>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Wishlist Sidebar */}
      <WishlistSidebar open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  );
}
