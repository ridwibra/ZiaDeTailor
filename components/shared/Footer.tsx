import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-16 rounded-lg border-t border-gray-300 bg-gray-100 p-8 text-gray-700 transition-colors duration-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <Link href="/" className="flex items-center gap-1">
            <Image
              src="/images/logo.jpeg"
              alt="ZiaDeTailor logo"
              width={60}
              height={60}
              className="rounded-md"
            />

            <p className="mx-5 hidden text-md font-medium tracking-wider text-gray-900 dark:text-gray-100 md:block">
              ZIADETAILOR.
            </p>
          </Link>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400 md:text-left">
            <p>© {new Date().getFullYear()} ZiaDeTailor.</p>
            <p>All rights reserved.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm md:items-start">
          <p className="font-semibold tracking-wide text-gray-900 underline dark:text-gray-100">
            CUSTOMER INFORMATION
          </p>

          <Link
            href="/shippingrates"
            className="text-gray-700 transition-colors hover:text-blue-600 hover:underline dark:text-gray-300 dark:hover:text-blue-400"
          >
            Shipping rates
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2 text-sm md:items-start">
          <p className="font-semibold tracking-wide text-gray-900 underline dark:text-gray-100">
            CONTACT
          </p>

          <p>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Email:
            </span>{" "}
            <a
              href="mailto:ziadetailor@gmail.com"
              className="text-gray-700 transition-colors hover:text-blue-600 hover:underline dark:text-gray-300 dark:hover:text-blue-400"
            >
              ziadetailor@gmail.com
            </a>
          </p>

          <p>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Phone:
            </span>{" "}
            <a
              href="tel:+16145894103"
              className="text-gray-700 transition-colors hover:text-blue-600 hover:underline dark:text-gray-300 dark:hover:text-blue-400"
            >
              +1 (614) 589-4103
            </a>
          </p>

          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Address:
          </p>

          <p className="text-center leading-tight text-gray-700 dark:text-gray-300 md:text-left">
            1556 Brookeville Avenue
            <br />
            Columbus, OH 43229
            <br />
            USA
          </p>

          <Link
            href="https://www.google.com/maps/place/40%C2%B006'21.9%22N+82%C2%B058'37.3%22W/@40.1060715,-82.9795875,17z/data=!3m1!4b1!4m4!3m3!8m2!3d40.1060715!4d-82.9770126?hl=en&entry=ttu&g_ep=EgoyMDI2MDcyNy4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 transition-colors hover:underline dark:text-blue-400"
          >
            View on Google Maps
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
