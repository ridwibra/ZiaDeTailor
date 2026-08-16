import Link from "next/link";

import Categories from "./Categories";
import Filter from "./Filter";
import ProductCard from "./ProductCard";
import { ProductType } from "@/utils/types";

async function getProducts(): Promise<ProductType[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? "";

    const response = await fetch(`${baseUrl}/api/product`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch products:", response.status);
      return [];
    }

    const data = await response.json();

    return Array.isArray(data.products) ? (data.products as ProductType[]) : [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

const newestFirst = (a: ProductType, b: ProductType) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const oldestFirst = (a: ProductType, b: ProductType) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

const lowestPriceFirst = (a: ProductType, b: ProductType) =>
  (a.sizes?.[0]?.price ?? 0) - (b.sizes?.[0]?.price ?? 0);

const highestPriceFirst = (a: ProductType, b: ProductType) =>
  (b.sizes?.[0]?.price ?? 0) - (a.sizes?.[0]?.price ?? 0);

export default async function ProductList({
  category,
  sort,
  query,
  subcategory,
}: {
  category: string;
  sort: string;
  query?: string;
  subcategory?: string;
}) {
  let products = await getProducts();

  const normalizedQuery = query?.trim().toLowerCase() || "";

  if (normalizedQuery) {
    products = products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";

      return (
        name.includes(normalizedQuery) || description.includes(normalizedQuery)
      );
    });
  }

  if (category && category !== "All") {
    products = products.filter((product) => product.category === category);
  }

  if (subcategory) {
    products = products.filter(
      (product) => product.subcategory === subcategory,
    );
  }

  const isHomepageDefault = !category && !normalizedQuery && !subcategory;

  const isAllProductsPage =
    category === "All" && !normalizedQuery && !subcategory;

  if (isHomepageDefault) {
    products = [...products].sort(newestFirst).slice(0, 10);
  }

  if (isAllProductsPage) {
    products = [...products].sort(newestFirst);
  }

  if (sort === "newest") {
    products = [...products].sort(newestFirst);
  }

  if (sort === "oldest") {
    products = [...products].sort(oldestFirst);
  }

  if (sort === "asc") {
    products = [...products].sort(lowestPriceFirst);
  }

  if (sort === "desc") {
    products = [...products].sort(highestPriceFirst);
  }

  return (
    <div className="w-full">
      <Categories />
      <Filter />

      {(category || subcategory) && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          {category && category !== "All" ? category : "All"}

          {subcategory && (
            <>
              {" / "}
              <span className="font-medium">{subcategory}</span>
            </>
          )}
        </div>
      )}

      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {products.length} item{products.length !== 1 ? "s" : ""}
      </p>

      {products.length > 0 ? (
        <div
          id="product-list"
          className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard
              key={
                (product as ProductType & { _id?: string })._id || product.slug
              }
              product={product}
            />
          ))}
        </div>
      ) : (
        <p className="py-10 text-sm text-gray-500 dark:text-gray-400">
          No products found.
        </p>
      )}

      {!normalizedQuery && !isAllProductsPage && (
        <Link
          href="/?category=All"
          className="mt-4 flex justify-end text-sm text-gray-500 underline"
        >
          View all products
        </Link>
      )}
    </div>
  );
}
