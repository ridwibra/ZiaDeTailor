import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer
      className="
        mt-16 
        bg-gray-100 dark:bg-gray-900 
        text-gray-700 dark:text-gray-300 
        p-8 
        rounded-lg 
        border-t border-gray-300 dark:border-gray-700
        transition-colors duration-300
      "
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-10">
        {/* BRAND + RIGHTS */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" className="flex items-center gap-1">
            <Image
              src="/images/logo.jpeg"
              alt="ZiaDeTailor logo"
              width={60}
              height={60}
              className="rounded-md"
            />

            <p
              className="
              hidden md:block 
              text-md font-medium tracking-wider 
              text-gray-900 dark:text-gray-100
              mx-5
            "
            >
              ZIADETAILOR.
            </p>
          </Link>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} ZiaDeTailor.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All rights reserved.
          </p>
        </div>

        {/* CONTACT INFO */}
        <div className="flex flex-col items-center md:items-start gap-2 text-sm">
          <p
            className="
            font-semibold 
            underline 
            tracking-wide 
            text-gray-900 dark:text-gray-100
          "
          >
            CONTACT
          </p>

          <p>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Email:
            </span>{" "}
            <span className="text-gray-700 dark:text-gray-300">
              ziadetailor@gmail.com
            </span>
          </p>

          <p>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Phone:
            </span>{" "}
            <span className="text-gray-700 dark:text-gray-300">
              +1 (614) 589-4103
            </span>
          </p>

          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Address:
          </p>

          <p
            className="
            text-gray-700 dark:text-gray-300 
            text-center md:text-left 
            leading-tight
          "
          >
            15 Court Street
            <br />
            Columbus, Ohio 45701
            <br />
            United States
          </p>

          <Link
            href="https://maps.google.com/?q=15+Court+Street+Athens+Ohio+45701"
            target="_blank"
            className="
              text-blue-600 dark:text-blue-400 
              hover:underline 
              transition-colors
            "
          >
            View on Google Maps
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
