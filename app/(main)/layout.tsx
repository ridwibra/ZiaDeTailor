import "../globals.css";
import type { Metadata } from "next";

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { SITE_NAME } from "@/utils/constants";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} – languages of the world`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `${SITE_NAME} to make languages visible`,
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
      <Navbar />
      <main className="w-full flex-1">{children}</main>
      <Footer />
    </div>
  );
}
