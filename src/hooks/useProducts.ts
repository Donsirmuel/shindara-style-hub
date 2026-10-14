import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchProductDetail, fetchProducts, type ProductListParams } from "@/lib/api";

export function useProducts(params: ProductListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
    staleTime: 60_000,
    enabled,
  });
}

export function useProductDetail(slugOrId: string | undefined) {
  return useQuery({
    queryKey: ["product", slugOrId],
    queryFn: () => fetchProductDetail(slugOrId as string),
    enabled: !!slugOrId,
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 300_000 });
}
