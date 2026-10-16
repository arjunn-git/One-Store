import { FALLBACK_PRODUCTS } from "./products";
import type { Product, ProductVariant, Category } from "@/lib/types/database";

declare global {
  // eslint-disable-next-line no-var
  var __one_store_admin_products__: (Product & { variants: ProductVariant[]; category?: Category })[] | undefined;
  // eslint-disable-next-line no-var
  var __one_store_inventory_movements__: InventoryMovementRecord[] | undefined;
}

export interface InventoryMovementRecord {
  id: string;
  variant_sku?: string;
  variant_id?: string;
  change_amount: number;
  previous_count?: number;
  new_count?: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export function getAdminProductsStore(): (Product & { variants: ProductVariant[]; category?: Category })[] {
  if (!globalThis.__one_store_admin_products__) {
    // Initialize with a deep clone of the canonical products so mutations do not mutate constants
    globalThis.__one_store_admin_products__ = JSON.parse(JSON.stringify(FALLBACK_PRODUCTS));
  }
  return globalThis.__one_store_admin_products__!;
}

export function saveAdminProduct(
  product: Product & { variants: ProductVariant[]; category?: Category }
): Product & { variants: ProductVariant[]; category?: Category } {
  const store = getAdminProductsStore();
  const existingIdx = store.findIndex((p) => p.id === product.id);
  if (existingIdx > -1) {
    store[existingIdx] = product;
  } else {
    store.unshift(product);
  }
  return product;
}

export function deleteAdminProduct(productId: string): boolean {
  const store = getAdminProductsStore();
  const idx = store.findIndex((p) => p.id === productId);
  if (idx > -1) {
    store.splice(idx, 1);
    return true;
  }
  return false;
}

export function getInventoryMovementsStore(): InventoryMovementRecord[] {
  if (!globalThis.__one_store_inventory_movements__) {
    globalThis.__one_store_inventory_movements__ = [
      {
        id: "m-init-001",
        variant_sku: "OAP-BLK-001-A",
        change_amount: 24,
        previous_count: 0,
        new_count: 24,
        reason: "Initial baseline stock intake",
        performed_by: "onestore.auth@gmail.com",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "m-init-002",
        variant_sku: "OAD-BLK-002-B",
        change_amount: -2,
        previous_count: 20,
        new_count: 18,
        reason: "Order dispatch allocation",
        performed_by: "system",
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ];
  }
  return globalThis.__one_store_inventory_movements__!;
}

export function updateAdminVariantStock(
  variantId: string,
  newCount: number,
  reason: string,
  performedBy: string
): { success: boolean; previousCount: number; newCount: number; changeAmount: number } | null {
  const products = getAdminProductsStore();
  for (const prod of products) {
    for (const v of prod.variants || []) {
      if (v.id === variantId || v.sku === variantId) {
        const previousCount = v.inventory_count ?? 0;
        const changeAmount = newCount - previousCount;
        v.inventory_count = newCount;

        const movements = getInventoryMovementsStore();
        movements.unshift({
          id: `m-${Date.now()}`,
          variant_sku: v.sku,
          variant_id: v.id,
          change_amount: changeAmount,
          previous_count: previousCount,
          new_count: newCount,
          reason,
          performed_by: performedBy,
          created_at: new Date().toISOString(),
        });

        return { success: true, previousCount, newCount, changeAmount };
      }
    }
  }
  return null;
}
