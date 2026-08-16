import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { ProductType } from "@/utils/types";
import ProductInteraction from "@/components/ProductInteraction";
import ProductImageGallery from "@/components/ImageGallery";
import DeleteProductButton from "@/components/DeleteProductButton";
import ProductReviews from "@/components/ProductReviews";
import { getSession } from "@/lib/server";

type Role = "admin" | "staff" | "user";

type ProductReview = {
  _id: string;
  user: string | { _id: string; name?: string };
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
};

type ProductDetail = ProductType & {
  _id: string;
  rating?: number;
  numReviews?: number;
  reviews?: ProductReview[];
};

async function getAllProducts(): Promise<ProductDetail[]> {
  const res = await fetch(`${process.env.BASE_URL}/api/product`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();

  return Array.isArray(data.products) ? (data.products as ProductDetail[]) : [];
}

async function getProductById(id: string): Promise<ProductDetail | null> {
  const res = await fetch(`${process.env.BASE_URL}/api/product/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  return data.product ? (data.product as ProductDetail) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const allProducts = await getAllProducts();
  const product = allProducts.find((item) => item.slug === slug);

  if (!product) {
    return {
      title: "Product not found",
      description: "This product does not exist.",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ color?: string; size?: string }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};

  const session = await getSession();
  const role = session?.user?.role as Role | undefined;
  const isAdmin = role === "admin" || role === "staff";

  const allProducts = await getAllProducts();
  const productBySlug = allProducts.find((item) => item.slug === slug);

  if (!productBySlug) {
    notFound();
  }

  const product = await getProductById(productBySlug._id);

  if (!product) {
    notFound();
  }

  const selectedColor = sp.color || "";

  const requestedSize = sp.size?.trim() || "";

  const selectedSize =
    product.sizes?.find((item) => item.size === requestedSize)?.size ||
    product.sizes?.[0]?.size ||
    "";

  const selectedSizeData =
    product.sizes?.find((item) => item.size === selectedSize) ??
    product.sizes?.[0];

  const selectedPrice = Number(selectedSizeData?.price ?? 0);

  const rating = Number(product.rating ?? 0);
  const numReviews = Number(product.numReviews ?? 0);

  return (
    <div className="min-h-screen bg-white pt-20 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        <div className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/products"
            className="transition hover:text-teal-600 dark:hover:text-teal-400"
          >
            Products
          </Link>

          <span className="mx-2">/</span>

          <span className="text-slate-800 dark:text-slate-200">
            {product.name}
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div className="min-w-0">
            <ProductImageGallery images={product.images} name={product.name} />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/products/${product.slug}/editproduct`}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>

                <DeleteProductButton
                  productId={product._id}
                  role={role as Role}
                />
              </div>
            ) : null}

            <div>
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                {product.category}
                {product.subcategory ? ` · ${product.subcategory}` : ""}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div
                  className="flex items-center gap-0.5"
                  aria-label={`${rating.toFixed(1)} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      aria-hidden="true"
                      className={
                        star <= Math.round(rating)
                          ? "text-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>

                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {rating > 0 ? rating.toFixed(1) : "No rating"}
                </span>

                <a
                  href="#reviews"
                  className="text-sm text-slate-500 underline underline-offset-4 transition hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  {numReviews} {numReviews === 1 ? "review" : "reviews"}
                </a>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              {product.description}
            </p>

            <div className="border-y border-slate-200 py-5 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedSize ? `Price for size ${selectedSize}` : "Price"}
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                ${selectedPrice.toFixed(2)}
              </h2>

              {selectedSize ? (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Select this size below. You can optionally add custom
                  measurements for tailoring while keeping the selected size as
                  the base size.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  This product does not have sizes configured yet.
                </p>
              )}
            </div>

            <ProductInteraction
              product={product}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
            />

            <p className="max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
              By clicking Pay Now, you agree to our{" "}
              <Link
                href="/terms"
                className="underline transition hover:text-slate-900 dark:hover:text-white"
              >
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline transition hover:text-slate-900 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <section
          id="reviews"
          className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800 lg:mt-16"
        >
          <ProductReviews
            productId={product._id}
            initialRating={rating}
            initialNumReviews={numReviews}
            initialReviews={product.reviews ?? []}
            currentUserId={session?.user?.id ?? null}
          />
        </section>
      </div>
    </div>
  );
}
