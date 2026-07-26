import "../globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { SITE_NAME } from "@/utils/constants";
import type { Metadata } from "next";
import { StoreProvider } from "@/store/Store";

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
    <StoreProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </div>
    </StoreProvider>
  );
}
