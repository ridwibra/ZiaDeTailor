import Link from "next/link";
import ProductCard from "./ProductCard";
import { ProductType } from "@/utils/types";
import Categories from "./Categories";
import Filter from "./Filter";

async function getProducts(): Promise<ProductType[]> {
  const res = await fetch(`${process.env.BASE_URL}/api/product`, {
    cache: "no-store",
  });

  const data = await res.json();
  return data.products;
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

  const q = query?.toLowerCase() || "";

  // 🔍 SEARCH FILTER
  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  // 1️⃣ DEFAULT HOMEPAGE: latest 10 products (only when no search)
  if (!category && !q) {
    products = products
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);
  }

  // 2️⃣ CATEGORY FILTER
  if (category && category !== "All") {
    products = products.filter((p) => p.category === category);
  }

  // 2️⃣.5 SUBCATEGORY FILTER
  if (subcategory) {
    products = products.filter((p) => p.subcategory === subcategory);
  }

  // 3️⃣ VIEW ALL PRODUCTS (FIXED: now respects subcategory)
  if (category === "All" && !q && !subcategory) {
    products = products.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // 4️⃣ SORTING LOGIC
  if (sort === "newest") {
    products = products.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  if (sort === "oldest") {
    products = products.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  if (sort === "asc") {
    products = products.sort((a, b) => a.sizes[0].price - b.sizes[0].price);
  }

  if (sort === "desc") {
    products = products.sort((a, b) => b.sizes[0].price - a.sizes[0].price);
  }

  return (
    <div className="w-full">
      <Categories />
      <Filter />

      {/*BREADCRUMB */}
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

      {/* PRODUCT COUNT */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {products.length} item{products.length !== 1 ? "s" : ""}
      </div>

      {/* ⭐ AUTO-SCROLL TARGET */}
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
