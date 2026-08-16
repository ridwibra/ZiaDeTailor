import ProductList from "@/components/ProductList";
import HomeBanner from "@/components/shared/Banner";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string;
    sort?: string;
    query?: string;
    subcategory?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <div className="space-y-12 px-2">
      <HomeBanner />

      <ProductList
        category={params.category || ""}
        sort={params.sort || ""}
        query={params.query || ""}
        subcategory={params.subcategory || ""}
      />
    </div>
  );
}
