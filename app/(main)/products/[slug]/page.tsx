import Image from "next/image";
import Link from "next/link";
import { ProductType } from "@/utils/types";
import ProductInteraction from "@/components/ProductInteraction";
import { Pencil, Trash2 } from "lucide-react";
import { getSession } from "@/lib/server";
import ProductImageGallery from "@/components/ImageGallery";
import DeleteProductButton from "@/components/DeleteProductButton";

type Role = "admin" | "staff" | "user";
/* Fetch ALL products */
async function getAllProducts(): Promise<ProductType[]> {
  const res = await fetch(`${process.env.BASE_URL}/api/product`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.products;
}

/* Fetch product by ID */
async function getProductById(id: string): Promise<ProductType | null> {
  const res = await fetch(`${process.env.BASE_URL}/api/product/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.product;
}

/* Metadata */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const allProducts = await getAllProducts();
  const product = allProducts.find((p) => p.slug === slug);

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

/* Product Page */
const ProductDetailPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ color?: string; size?: string }>;
}) => {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};

  // ⭐ BetterAuth session
  const session = await getSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "staff";

  const allProducts = await getAllProducts();
  const productBySlug = allProducts.find((p) => p.slug === slug);

  if (!productBySlug) {
    return <div className="mt-12 text-center">Product not found.</div>;
  }

  const productId = (productBySlug as any)._id;
  const product = await getProductById(productId);

  if (!product) {
    return <div className="mt-12 text-center">Product not found.</div>;
  }

  const selectedColor = sp.color || product.colors[0]?.hex || "#000000";
  const selectedSize = sp.size || product.sizes[0]?.size || "M";

  // ⭐ NEW: Active image state (first image by default)
  const activeImage = product.images[0]?.url;

  return (
    <div className="flex flex-col lg:flex-row gap-12 mt-20 px-4 lg:px-12">
      {/* IMAGE */}
      <div className="w-full lg:w-5/12">
        {/* MAIN IMAGE */}
        <ProductImageGallery images={product.images} name={product.name} />
      </div>

      {/* DETAILS */}
      <div className="w-full lg:w-7/12 flex flex-col gap-6">
        {/* ⭐ ADMIN ACTIONS */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/products/${product.slug}/editproduct`}
            className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>

          {/* <form
            action={async () => {
              "use server";
              await fetch(
                `${process.env.BASE_URL}/api/product/${(product as any)._id}`,
                {
                  method: "DELETE",
                },
              );
            }}
          >
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </form> */}
          {isAdmin && (
            <DeleteProductButton
              productId={(product as any)._id}
              role={session?.user?.role as Role}
            />
          )}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          {product.name}
        </h1>

        <p className="text-gray-600 leading-relaxed text-sm max-w-xl">
          {product.description}
        </p>

        <h2 className="text-3xl font-bold">
          $
          {(
            product.sizes.find((s) => s.size === selectedSize)?.price ||
            product.sizes[0]?.price
          ).toFixed(2)}
        </h2>

        <ProductInteraction
          product={product}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
        />

        {/* PAYMENT INFO */}
        <div className="flex items-center gap-4 mt-6">
          <Image src="/klarna.png" alt="klarna" width={60} height={30} />
          <Image src="/cards.png" alt="cards" width={60} height={30} />
          <Image src="/stripe.png" alt="stripe" width={60} height={30} />
        </div>

        <p className="text-gray-500 text-xs max-w-md">
          By clicking Pay Now, you agree to our{" "}
          <span className="underline hover:text-black">Terms & Conditions</span>{" "}
          and <span className="underline hover:text-black">Privacy Policy</span>
          .
        </p>
      </div>
    </div>
  );
};

export default ProductDetailPage;
