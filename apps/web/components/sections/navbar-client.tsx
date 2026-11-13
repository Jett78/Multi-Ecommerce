"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Package,
  Settings,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartIcon } from "@/components/cart/cart-icon";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useWishlistStore } from "@/stores/wishlist-store";
import { WishlistSidebar } from "@/components/wishlist/wishlist-sidebar";
import { useSession, signOut } from "@/lib/auth-client";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { CompanyProfile } from "@/types/company-profile";
import type { Product } from "@/types/product";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSearchProducts = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiClient<{ data: Product[] }>(
        `${API_ROUTES.PRODUCT}?take=10&skip=0&search=${encodeURIComponent(query)}`,
      );
      setSearchResults(response?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  React.useEffect(() => {
    handleSearchProducts(debouncedSearch);
  }, [debouncedSearch, handleSearchProducts]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    document.cookie = "user_role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    localStorage.removeItem("auth_redirect");
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  const handleSuggestionClick = (product: Product) => {
    router.push(`/products/${product.slug}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleLoginClick = () => {
    openLogin(pathname);
  };

  return (
    <>
      {/* Top info bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ",
          showNavbar ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="bg-primarymain text-white ">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="hidden md:flex h-10 items-center justify-between">
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  About
                </Link>
                <Link
                  href="/products"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Shop
                </Link>
                <Link
                  href="/blog"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Blog
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  Contact
                </Link>
              </div>
              <div className="flex items-center gap-6">
                {company?.phoneNumber && (
                  <a
                    href={`tel:${company.phoneNumber.replace(/[^\d+]/g, "")}`}
                    className="text-sm hover:opacity-80 transition-opacity"
                  >
                    📞 {company.phoneNumber}
                  </a>
                )}
                {company?.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className="text-sm hover:opacity-80 transition-opacity"
                  >
                    ✉️ {company.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed left-0 right-0 z-50 border-b border-gray-200 bg-white transition-[top] duration-300 ease-in-out top-0",
          showNavbar ? "md:top-10" : "md:top-0",
        )}
      >
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Desktop layout */}
            <div className="hidden md:flex h-16 items-center justify-between gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0">
                {company?.logoKey ? (
                  <Image
                    src={company.logoKey}
                    alt={company.companyName || "Logo"}
                    width={50}
                    height={60}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xl font-bold tracking-tight text-gray-900">
                    {company?.companyName || "Store"}
                  </span>
                )}
              </Link>

              {/* Search Bar */}
              <div
                ref={searchRef}
                className="relative flex-1 max-w-2xl mx-auto"
              >
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-primarymain rounded-full animate-spin" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search products..."
                      className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primarymain/20 focus:border-primarymain transition-shadow"
                    />
                  </div>
                </form>
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                    {searchResults.map((product) => {
                      const productImage =
                        product.images?.find((img) => img.isPrimary) ||
                        product.images?.[0];
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSuggestionClick(product)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {productImage?.url ? (
                              <img
                                src={productImage.url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                {product.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {product.variants?.[0]?.price
                                ? `Rs. ${product.variants[0].price.toLocaleString()}`
                                : "No price"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right section */}
              <div className="flex items-center gap-1">
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
                      <span className="max-w-[100px] truncate">
                        {session.user.name}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          userMenuOpen && "rotate-180",
                        )}
                      />
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
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primarymain px-4 text-sm font-bold text-white transition-colors hover:bg-primarymain/90"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile layout */}
            <div className="flex md:hidden flex-col">
              {/* Top row: Logo + Hamburger */}
              <div className="flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center">
                  {company?.logoKey ? (
                    <Image
                      src={company.logoKey}
                      alt={company.companyName || "Logo"}
                      width={44}
                      height={44}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-sm font-bold tracking-tight text-gray-900">
                      {company?.companyName || "Store"}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-2">
                  {/* Mobile nav icons */}
                  <button
                    onClick={() => setWishlistOpen(true)}
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label={`Wishlist with ${wishlistItemCount} items`}
                  >
                    <Heart className="h-5 w-5" />
                    {wishlistItemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primarymain text-[9px] font-bold text-white">
                        {wishlistItemCount > 9 ? "9+" : wishlistItemCount}
                      </span>
                    )}
                  </button>

                  <CartIcon onClick={() => setCartOpen(true)} />

                  <button
                    className="inline-flex h-9 w-9 items-center justify-center text-gray-600 transition-colors hover:text-gray-900"
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

              {/* Search row */}
              <div className="pb-3">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-primarymain rounded-full animate-spin" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search products..."
                      className="w-full h-10 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primarymain/20 focus:border-primarymain transition-shadow"
                    />
                  </div>
                </form>
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute z-50 left-4 right-4 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                    {searchResults.map((product) => {
                      const productImage =
                        product.images?.find((img) => img.isPrimary) ||
                        product.images?.[0];
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSuggestionClick(product)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {productImage?.url ? (
                              <img
                                src={productImage.url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                {product.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {product.variants?.[0]?.price
                                ? `Rs. ${product.variants[0].price.toLocaleString()}`
                                : "No price"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {session.user.email}
                    </p>
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
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 px-0 py-3 text-[15px] font-medium text-red-600 transition-colors hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLoginClick();
                }}
                className="flex w-full items-center justify-center gap-2 bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                <User className="h-4 w-4" />
                Sign In
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                setWishlistOpen(true);
              }}
              className="flex w-full items-center gap-3 px-0 py-3 text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              <Heart className="h-5 w-5" />
              Wishlist
              {wishlistItemCount > 0 && (
                <span className="ml-auto text-[11px] text-gray-400">
                  ({wishlistItemCount})
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setCartOpen(true);
              }}
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
      <WishlistSidebar
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </>
  );
}
