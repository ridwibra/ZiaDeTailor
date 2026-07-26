import "../globals.css";

import type { Metadata } from "next";

import { SITE_NAME } from "@/utils/constants";
import Footer from "@/components/shared/Footer";
import AuthNavbar from "@/components/shared/AuthNavbar";

export const metadata: Metadata = {
  title: {
    default: `Authentication | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `Authentication pages for the ${SITE_NAME} platform.`,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <AuthNavbar />

        <main className="flex-1 w-full">{children}</main>

        <Footer />
      </div>
    </>
  );
}
