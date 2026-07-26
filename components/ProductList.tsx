import Link from "next/link";
import ProductCard from "./ProductCard";
import { ProductType } from "@/utils/types";
import Categories from "./Categories";
import Filter from "./Filter";

async function getProducts(): Promise<ProductType[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/product`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

const ProductList = async ({
  category,
  sort,
  query,
  subcategory,
}: {
  category: string;
  sort: string;
  query?: string;
  subcategory?: string;
}) => {
  let products = await getProducts();

  if (!Array.isArray(products)) products = [];

  const q = query?.toLowerCase() || "";

  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  if (!category && !q) {
    products = [...products]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);
  }

  if (category && category !== "All") {
    products = products.filter((p) => p.category === category);
  }

  if (subcategory) {
    products = products.filter((p) => p.subcategory === subcategory);
  }

  if (category === "All" && !q && !subcategory) {
    products = [...products].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  if (sort === "newest") {
    products = [...products].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  if (sort === "oldest") {
    products = [...products].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  if (sort === "asc") {
    products = [...products].sort(
      (a, b) => (a.sizes?.[0]?.price ?? 0) - (b.sizes?.[0]?.price ?? 0),
    );
  }

  if (sort === "desc") {
    products = [...products].sort(
      (a, b) => (b.sizes?.[0]?.price ?? 0) - (a.sizes?.[0]?.price ?? 0),
    );
  }

  return (
    <div className="w-full">
      <Categories />
      <Filter />

      {(category || subcategory) && (
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {category && category !== "All" ? category : "All"}
          {subcategory && (
            <>
              {" / "}
              <span className="font-medium">{subcategory}</span>
            </>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {products.length} item{products.length !== 1 ? "s" : ""}
      </div>

      <div
        id="product-list"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12"
      >
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {!q && (
        <Link
          href="/?category=All"
          className="flex justify-end mt-4 underline text-sm text-gray-500"
        >
          View all products
        </Link>
      )}
    </div>
  );
};

export default ProductList;
