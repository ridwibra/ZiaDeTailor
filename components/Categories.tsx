"use client";

import { XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_MAP } from "@/utils/categoryMap";

const Categories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedCategory = searchParams.get("category") || "All";

  const scrollToProducts = () => {
    const el = document.getElementById("product-list");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", value);
    params.delete("subcategory");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    scrollToProducts();
  };

  const subcategories =
    selectedCategory !== "All"
      ? CATEGORY_MAP[selectedCategory as keyof typeof CATEGORY_MAP] || []
      : [];

  return (
    <div className="space-y-3">
      {/* MAIN CATEGORY ROW */}
      <div
        className="
          grid 
          grid-cols-[repeat(auto-fit,minmax(100px,1fr))] 
          gap-2 
          bg-gray-100 dark:bg-gray-800 
          p-2 
          rounded-lg 
          text-sm
        "
      >
        <div
          className={`flex items-center justify-center cursor-pointer px-2 py-1 rounded-md ${
            selectedCategory === "All"
              ? "bg-white dark:bg-gray-700"
              : "text-gray-500 dark:text-gray-300"
          }`}
          onClick={() => handleChange("All")}
        >
          All
        </div>

        {Object.keys(CATEGORY_MAP).map((cat) => (
          <div
            key={cat}
            className={`flex items-center justify-center cursor-pointer px-2 py-1 rounded-md ${
              selectedCategory === cat
                ? "bg-white dark:bg-gray-700"
                : "text-gray-500 dark:text-gray-300"
            }`}
            onClick={() => handleChange(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* SUBCATEGORY ROW */}
      {subcategories.length > 0 && (
        <div
          className="
            grid 
            grid-cols-[repeat(auto-fit,minmax(100px,1fr))] 
            gap-2 
            bg-gray-50 dark:bg-gray-700 
            p-2 
            rounded-lg 
            text-xs
          "
        >
          {subcategories.map((sub) => {
            const isSelected = searchParams.get("subcategory") === sub;

            return (
              <div
                key={sub}
                className={`flex items-center justify-center cursor-pointer px-2 py-1 rounded-md transition
                  ${
                    isSelected
                      ? "bg-white dark:bg-gray-600 font-medium"
                      : "text-gray-600 dark:text-gray-300"
                  }
                `}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("subcategory", sub);

                  router.push(`${pathname}?${params.toString()}`, {
                    scroll: false,
                  });

                  scrollToProducts();
                }}
              >
                {sub}
              </div>
            );
          })}
        </div>
      )}

      {/* CLEAR SUBCATEGORY BUTTON */}
      {searchParams.get("subcategory") && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("subcategory");

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
            scrollToProducts();
          }}
          className="flex items-center gap-1 text-xs text-gray-500 ml-1 hover:text-gray-700 transition"
        >
          <XCircle className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
};

export default Categories;
