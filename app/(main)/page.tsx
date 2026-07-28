import ProductList from "@/components/ProductList";
import HomeBanner from "@/components/shared/Banner";
import Link from "next/link";

const HomePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string;
    sort?: string;
    query?: string;
    subcategory?: string;
  }>;
}) => {
  const params = searchParams ? await searchParams : {};

  const category = params.category || "";
  const sort = params.sort || "";
  const query = params.query || "";
  const subcategory = params.subcategory || ""; // ⭐ FIX

  return (
    <div className="space-y-12 px-2">
      <HomeBanner />
      {/* <Link href="/products/newproduct">testing</Link> */}
      <ProductList
        category={category}
        sort={sort}
        query={query}
        subcategory={subcategory} // now works
      />
    </div>
  );
};

export default HomePage;
