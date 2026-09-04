"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Settings, Shield, LogOut, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { showSuccess } from "@/lib/toast-helper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const navItems = [
  { name: "Profile", href: "/profile/user", icon: User },
  { name: "My Orders", href: "/profile/user/orders", icon: Package },
  { name: "Account Settings", href: "/profile/user/settings", icon: Settings },
  { name: "Security", href: "/profile/user/security", icon: Shield },
];

export function ProfileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/profile/user") return pathname === "/profile/user";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }

    showSuccess("Logged out successfully");
    router.push("/login");
  };

  return (
    <nav className="bg-white border border-gray-200 p-2">
      <div className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primarymain text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="size-4" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <AlertDialog>
          <AlertDialogTrigger>
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
              <LogOut className="size-4" />
              <span>Logout</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will need to log in again
                to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </nav>
  );
}
