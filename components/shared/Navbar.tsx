"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Home,
  Bell,
  ShoppingCart,
  Search,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  UserCircle,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Pacifico } from "next/font/google";
import { SITE_NAME } from "@/utils/constants";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/Store";
import { UserType } from "@/utils/types";

const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [sessionFailed, setSessionFailed] = useState(false);

  const { state } = useStore();
  const cartItemsCount = state.cart.cartItems.reduce(
    (a, c) => a + c.quantity,
    0,
  );
  const router = useRouter();

  const sessionResult = authClient.useSession();
  const session = sessionFailed ? null : sessionResult.data;
  const user = session?.user as (UserType & { id: string }) | undefined;
  const role = user?.role;
  const canAccessAdmin = role === "admin" || role === "staff";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (sessionResult.error) {
      setSessionFailed(true);
    }
  }, [sessionResult.error]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const isDark = mounted && theme === "dark";

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setShowDropdown(false);
            router.push("/login");
          },
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  };

  useEffect(() => {
    const q = search.trim();
    const t = setTimeout(() => {
      router.push(q ? `/?query=${encodeURIComponent(q)}` : "/", {
        scroll: false,
      });
    }, 250);

    return () => clearTimeout(t);
  }, [search, router]);

  const avatarUrl = user?.avatar?.image_url || user?.image || null;
  const firstName = user?.name?.trim()?.split(/\s+/)?.[0] || "User";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/logo.jpeg"
          alt="Logo"
          width={120}
          height={120}
          className="rounded-md"
          loading="eager"
          priority
        />
        <p
          className={`hidden md:block text-2xl font-bold text-gray-900 dark:text-gray-100 ${pacifico.className}`}
        >
          {SITE_NAME}
        </p>
      </Link>

      <div className="flex items-center gap-6">
        <div className="ml-2 flex items-center gap-2 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 px-2 py-1 shadow-sm bg-white dark:bg-gray-800 transition-colors duration-300 w-28 sm:w-40 md:w-56">
          <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-300" />
          <input
            id="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs sm:text-sm outline-0 bg-transparent text-gray-700 dark:text-gray-200 w-full"
          />
        </div>

        <Link href="/">
          <Home className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors" />
        </Link>

        {/* <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors" /> */}

        <Link href="/cart" className="relative">
          <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300 transition-colors" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {cartItemsCount}
            </span>
          )}
        </Link>

        <button
          onClick={toggleTheme}
          className="relative w-6 h-6 flex items-center justify-center"
          aria-label="Toggle theme"
        >
          <Moon
            className={`absolute w-4 h-4 text-gray-600 dark:text-gray-300 transition-all ${
              isDark
                ? "opacity-0 scale-0 -rotate-90"
                : "opacity-100 scale-100 rotate-0"
            }`}
          />
          <Sun
            className={`absolute w-4 h-4 text-gray-600 dark:text-gray-300 transition-all ${
              isDark
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-0 rotate-90"
            }`}
          />
        </button>

        {session ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              {avatarUrl ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src={avatarUrl}
                    alt={user?.name || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                </div>
              )}

              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {firstName}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
                {canAccessAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowDropdown(false)}
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
