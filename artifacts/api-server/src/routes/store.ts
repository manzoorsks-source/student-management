import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import {
  AdvanceOrder,
  CreateAdvanceOrderBody,
  CreateAdvanceOrderResponse,
  CreateOrderBody,
  CreateOrderResponse,
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  GetStorefrontSummaryResponse,
  ListAdminAdvanceOrdersResponse,
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  ListAdminProductsQueryParams,
  ListAdminProductsResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  GetOrderResponse,
  Product,
  ProductInput,
  ProductUpdate,
  UpdateAdminSettingsBody,
  UpdateAdminSettingsResponse,
  UpdateProductBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  advanceOrdersTable,
  auditLogsTable,
  ordersTable,
  productsTable,
  storeSettingsTable,
  variantsTable,
} from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const demoImages = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1583391733956-6c78276477e9?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85",
];

const demoProducts = [
  {
    id: "prod-royal-emerald",
    slug: "royal-emerald-kanjeevaram",
    name: "Royal Emerald Kanjeevaram",
    category: "Sarees",
    fabric: "Pure silk",
    description: "A deep emerald silk saree finished with an antique gold zari border for evening celebrations.",
    care: "Dry clean only. Fold with the zari inside and store away from direct sunlight.",
    costPrice: "4200",
    price: "7490",
    salePrice: null,
    imageUrl: demoImages[0],
    status: "published",
    variants: [
      { id: "var-royal-emerald-rose", sku: "IF-RE-ROSE", color: "Rose gold", size: "Free size", price: "7490", salePrice: null, quantity: "7", lowStockThreshold: "2" },
      { id: "var-royal-emerald-gold", sku: "IF-RE-GOLD", color: "Antique gold", size: "Free size", price: "7490", salePrice: null, quantity: "2", lowStockThreshold: "2" },
    ],
  },
  {
    id: "prod-maroon-banarasi",
    slug: "maroon-banarasi-weave",
    name: "Maroon Banarasi Weave",
    category: "Sarees",
    fabric: "Banarasi silk",
    description: "A wine-maroon drape with a handpicked floral weave and a quietly luminous finish.",
    care: "Dry clean recommended. Air before folding and use a muslin wrap for storage.",
    costPrice: "3600",
    price: "6290",
    salePrice: "5690",
    imageUrl: demoImages[1],
    status: "published",
    variants: [
      { id: "var-maroon-banarasi-rose", sku: "IF-MB-ROSE", color: "Maroon", size: "Free size", price: "6290", salePrice: "5690", quantity: "4", lowStockThreshold: "2" },
      { id: "var-maroon-banarasi-gold", sku: "IF-MB-GOLD", color: "Gold", size: "Free size", price: "6290", salePrice: "5690", quantity: "0", lowStockThreshold: "2" },
    ],
  },
  {
    id: "prod-silk-cream",
    slug: "silk-cream-chanderi",
    name: "Silk Cream Chanderi",
    category: "Sarees",
    fabric: "Chanderi silk",
    description: "An airy silk-cream Chanderi with a fine antique border for intimate daytime occasions.",
    care: "Dry clean only. Keep folded in a soft cotton cloth.",
    costPrice: "2700",
    price: "4890",
    salePrice: null,
    imageUrl: demoImages[2],
    status: "published",
    variants: [
      { id: "var-silk-cream-blue", sku: "IF-SC-BLUE", color: "Sky blue", size: "Free size", price: "4890", salePrice: null, quantity: "1", lowStockThreshold: "2" },
    ],
  },
  {
    id: "prod-teal-organza",
    slug: "teal-organza-edit",
    name: "Teal Organza Edit",
    category: "Sarees",
    fabric: "Organza",
    description: "A crisp teal organza with a sculptural drape and a slim maroon selvedge.",
    care: "Steam lightly from the reverse. Dry clean for stain removal.",
    costPrice: "2200",
    price: "3990",
    salePrice: null,
    imageUrl: demoImages[3],
    status: "published",
    variants: [
      { id: "var-teal-organza-teal", sku: "IF-TO-TEAL", color: "Jewel teal", size: "Free size", price: "3990", salePrice: null, quantity: "0", lowStockThreshold: "2" },
    ],
  },
];

const toNumber = (value: string | number | null | undefined) =>
  value === null || value === undefined ? null : Number(value);

const slugToAlt = (name: string) => `${name} saree on a warm studio backdrop`;

const getAvailability = (quantity: number, threshold: number) => {
  if (quantity <= 0) return "out_of_stock" as const;
  if (quantity <= threshold) return "low_stock" as const;
  return "available" as const;
};

type ProductRow = typeof productsTable.$inferSelect;
type VariantRow = typeof variantsTable.$inferSelect;

const toProductCard = (product: ProductRow, variants: VariantRow[]) => {
  const quantity = variants.reduce((sum, variant) => sum + Number(variant.quantity), 0);
  const threshold = variants.reduce((sum, variant) => sum + Number(variant.lowStockThreshold), 0);
  const activePrice = product.salePrice ?? product.price;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    fabric: product.fabric,
    image: { id: `${product.id}-primary`, url: product.imageUrl, alt: slugToAlt(product.name), isPrimary: true },
    price: Number(activePrice),
    originalPrice: product.salePrice ? Number(product.price) : null,
    badge: product.salePrice ? "Festive edit" : product.createdAt && Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30 ? "New arrival" : null,
    availability: getAvailability(quantity, Math.max(threshold, 1)),
    reviewCount: product.id.length * 7,
  };
};

const toProduct = (product: ProductRow, variants: VariantRow[]) => ({
  ...toProductCard(product, variants),
  description: product.description,
  care: product.care,
  images: [
    { id: `${product.id}-primary`, url: product.imageUrl, alt: slugToAlt(product.name), isPrimary: true },
    { id: `${product.id}-detail`, url: product.imageUrl, alt: `${product.name} fabric detail`, isPrimary: false },
  ],
  variants: variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    color: variant.color,
    size: variant.size,
    price: Number(variant.price),
    salePrice: toNumber(variant.salePrice),
    quantity: Number(variant.quantity),
    lowStockThreshold: Number(variant.lowStockThreshold),
  })),
  seoTitle: `${product.name} | India Fashions`,
  seoDescription: product.description,
});

const toAdminProduct = (product: ProductRow, variants: VariantRow[]) => ({
  ...toProduct(product, variants),
  costPrice: Number(product.costPrice),
  status: product.status as "draft" | "published" | "archived",
});

async function ensureSeeded() {
  const existing = await db.select({ id: productsTable.id }).from(productsTable).limit(1);
  if (existing.length > 0) return;
  for (const product of demoProducts) {
    await db.insert(productsTable).values({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      fabric: product.fabric,
      description: product.description,
      care: product.care,
      costPrice: product.costPrice,
      price: product.price,
      salePrice: product.salePrice,
      imageUrl: product.imageUrl,
      status: product.status,
    });
    await db.insert(variantsTable).values(product.variants.map((variant) => ({
      ...variant,
      productId: product.id,
    })));
  }
  await db.insert(storeSettingsTable).values({
    brandName: "India Fashions",
    shopAddress: "India Fashions, Main Market",
    deliveryRadiusKm: "12",
    deliveryCharge: "99",
    codEnabled: true,
    upiEnabled: true,
    cardEnabled: true,
    bankTransferEnabled: true,
  });
  await db.insert(auditLogsTable).values({
    actor: "system",
    entity: "catalog",
    action: "seeded",
    detail: "Demo saree catalog created",
  });
  logger.info("India Fashions demo catalog seeded");
}

async function productRows() {
  await ensureSeeded();
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  const variants = await db.select().from(variantsTable);
  return products.map((product) => ({
    product,
    variants: variants.filter((variant) => variant.productId === product.id),
  }));
}

router.get("/storefront/summary", async (_req, res) => {
  const rows = await productRows();
  const cards = rows.map(({ product, variants }) => toProductCard(product, variants));
  const settings = (await db.select().from(storeSettingsTable).limit(1))[0];
  const hero = cards[0];
  const response = {
    brandName: settings?.brandName ?? "India Fashions",
    tagline: "Built for trust. Made for the moment.",
    ticker: ["Today offers", "Festive edits", "UPI & cards accepted", "Delivery within 12 km"],
    hero: {
      eyebrow: "The Royal Heritage edit",
      title: "Drape the moment.",
      body: "Silks, weaves and quiet heirlooms selected for celebrations that stay with you.",
      cta: "Shop the sarees",
      image: hero.image,
    },
    categories: ["Sarees", "Punjabi Dresses", "Children", "Kurti", "Lehenga", "Salwar Suit", "Men's Ethnic", "Accessories"],
    featured: cards.slice(0, 3),
    newArrivals: cards.slice(1, 4),
    trustPoints: [
      { title: "Real product photography", body: "See the weave, drape and detail before you decide." },
      { title: "Local delivery", body: "Carefully packed delivery within a 12 km radius." },
      { title: "Clear stock status", body: "Latest inventory truth, from our team to your screen." },
    ],
  };
  res.json(GetStorefrontSummaryResponse.parse(response));
});

router.get("/products", async (req, res) => {
  const params = ListProductsQueryParams.parse(req.query);
  let rows = await productRows();
  const search = params.search?.toLowerCase();
  rows = rows.filter(({ product, variants }) => {
    const card = toProductCard(product, variants);
    if (search && !`${product.name} ${product.fabric} ${variants.map((variant) => variant.sku).join(" ")}`.toLowerCase().includes(search)) return false;
    if (params.category && product.category.toLowerCase() !== params.category.toLowerCase()) return false;
    if (params.fabric && product.fabric.toLowerCase() !== params.fabric.toLowerCase()) return false;
    if (params.color && !variants.some((variant) => variant.color.toLowerCase() === params.color?.toLowerCase())) return false;
    if (params.minPrice !== undefined && card.price < params.minPrice) return false;
    if (params.maxPrice !== undefined && card.price > params.maxPrice) return false;
    if (params.availability !== "all" && card.availability !== params.availability) return false;
    if (params.sale !== undefined && Boolean(product.salePrice) !== params.sale) return false;
    return true;
  });
  if (params.sort === "price_asc") rows.sort((a, b) => toProductCard(a.product, a.variants).price - toProductCard(b.product, b.variants).price);
  if (params.sort === "price_desc") rows.sort((a, b) => toProductCard(b.product, b.variants).price - toProductCard(a.product, a.variants).price);
  const response = rows.map(({ product, variants }) => toProductCard(product, variants));
  res.json(ListProductsResponse.parse(response));
});

router.get("/products/:slug", async (req, res) => {
  const { slug } = GetProductParams.parse(req.params);
  const row = (await productRows()).find(({ product }) => product.slug === slug);
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(toProduct(row.product, row.variants)));
});

router.post("/advance-orders", async (req, res) => {
  const body = CreateAdvanceOrderBody.parse(req.body);
  const id = `advance-${Date.now()}`;
  const created = await db.insert(advanceOrdersTable).values({
    id,
    variantId: body.variantId,
    productName: body.productName,
    customerName: body.customerName,
    phone: body.phone,
    note: body.note ?? "",
    status: "pending",
  }).returning();
  res.status(201).json(CreateAdvanceOrderResponse.parse({
    ...body,
    id,
    status: "pending",
    createdAt: created[0]?.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
});

router.post("/orders", async (req, res) => {
  const body = CreateOrderBody.parse(req.body);
  const settings = (await db.select().from(storeSettingsTable).limit(1))[0];
  const radius = Number(settings?.deliveryRadiusKm ?? 12);
  if (body.distanceKm > radius) {
    res.status(409).json({ error: `Delivery is available within ${radius} km only.` });
    return;
  }
  const id = `order-${Date.now()}`;
  const orderNumber = `IF-${String(Date.now()).slice(-6)}`;
  const total = body.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + Number(settings?.deliveryCharge ?? 99);
  const paymentStatus = body.paymentMethod === "bank_transfer" ? "verification_required" : body.paymentMethod === "cod" ? "pending" : "paid";
  const result = await db.transaction(async (tx) => {
    for (const item of body.items) {
      const variant = (await tx.select().from(variantsTable).where(eq(variantsTable.id, item.variantId)).limit(1))[0];
      if (!variant || Number(variant.quantity) < item.quantity) throw new Error(`Insufficient stock for ${item.sku}`);
      await tx.update(variantsTable).set({ quantity: String(Number(variant.quantity) - item.quantity) }).where(eq(variantsTable.id, item.variantId));
    }
    return tx.insert(ordersTable).values({
      id,
      orderNumber,
      customerName: body.customerName,
      phone: body.phone,
      address: body.address,
      distanceKm: String(body.distanceKm),
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference ?? null,
      items: body.items,
      total: String(total),
      paymentStatus,
      fulfilmentStatus: "placed",
    }).returning();
  });
  const created = result[0];
  if (!created) {
    res.status(500).json({ error: "Unable to create order" });
    return;
  }
  res.status(201).json(CreateOrderResponse.parse({
    ...body,
    id: created.id,
    orderNumber: created.orderNumber,
    total: Number(created.total),
    paymentStatus: created.paymentStatus,
    fulfilmentStatus: created.fulfilmentStatus,
    createdAt: created.createdAt.toISOString(),
  }));
});

router.get("/orders/:id", async (req, res) => {
  const row = (await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.id)).limit(1))[0];
  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse({
    customerName: row.customerName,
    phone: row.phone,
    address: row.address,
    distanceKm: Number(row.distanceKm),
    paymentMethod: row.paymentMethod,
    paymentReference: row.paymentReference,
    items: row.items,
    id: row.id,
    orderNumber: row.orderNumber,
    total: Number(row.total),
    paymentStatus: row.paymentStatus,
    fulfilmentStatus: row.fulfilmentStatus,
    createdAt: row.createdAt.toISOString(),
  }));
});

router.get("/admin/dashboard", async (_req, res) => {
  const rows = await productRows();
  const orders = await db.select().from(ordersTable);
  const advanceOrders = await db.select().from(advanceOrdersTable);
  const settings = (await db.select().from(storeSettingsTable).limit(1))[0];
  const cards = rows.map(({ product, variants }) => toProductCard(product, variants));
  const salesToday = orders.reduce((sum, order) => sum + Number(order.total), 0);
  res.json({
    salesToday,
    pendingOrders: orders.filter((order) => ["placed", "confirmed"].includes(order.fulfilmentStatus)).length,
    lowStock: cards.filter((card) => card.availability === "low_stock").length,
    outOfStock: cards.filter((card) => card.availability === "out_of_stock").length,
    paymentVerification: orders.filter((order) => order.paymentStatus === "verification_required").length,
    advanceOrders: advanceOrders.filter((order) => order.status === "pending").length,
    topCategories: [{ name: "Sarees", value: cards.length }],
    recentActivity: [
      { label: "Catalog ready", detail: `${cards.length} sarees published`, time: "Today" },
      { label: "Delivery radius", detail: `Within ${settings?.deliveryRadiusKm ?? 12} km`, time: "Configured" },
      { label: "Inventory truth", detail: "Variant stock is live", time: "Active" },
    ],
  });
});

router.get("/admin/products", async (req, res) => {
  const params = ListAdminProductsQueryParams.parse(req.query);
  const rows = await productRows();
  const search = params.search?.toLowerCase();
  const response = rows
    .filter(({ product }) => !search || `${product.name} ${product.slug}`.toLowerCase().includes(search))
    .map(({ product, variants }) => toAdminProduct(product, variants));
  res.json(ListAdminProductsResponse.parse(response));
});

router.post("/admin/products", async (req, res) => {
  const body = CreateProductBody.parse(req.body);
  if (body.price < body.costPrice) {
    res.status(409).json({ error: "Selling price cannot be lower than cost price." });
    return;
  }
  const id = `prod-${Date.now()}`;
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const created = await db.insert(productsTable).values({
    id,
    slug,
    name: body.name,
    category: body.category,
    fabric: body.fabric,
    description: body.description,
    care: body.care,
    costPrice: String(body.costPrice),
    price: String(body.price),
    imageUrl: body.imageUrl,
    status: "draft",
  }).returning();
  await db.insert(variantsTable).values({
    id: `${id}-default`,
    productId: id,
    sku: `${slug.slice(0, 8).toUpperCase()}-001`,
    color: "Default",
    size: "Free size",
    price: String(body.price),
    quantity: "0",
    lowStockThreshold: "2",
  });
  await db.insert(auditLogsTable).values({ actor: "shop-owner", entity: "product", action: "created", detail: body.name });
  const product = created[0];
  const variants = await db.select().from(variantsTable).where(eq(variantsTable.productId, id));
  res.status(201).json(toAdminProduct(product!, variants));
});

router.patch("/admin/products/:id", async (req, res) => {
  const body = UpdateProductBody.parse(req.body);
  const existing = (await db.select().from(productsTable).where(eq(productsTable.id, req.params.id)).limit(1))[0];
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const price = body.price ?? Number(existing.price);
  const salePrice = body.salePrice ?? (existing.salePrice ? Number(existing.salePrice) : null);
  if (price < Number(existing.costPrice) || (salePrice !== null && salePrice < Number(existing.costPrice))) {
    res.status(409).json({ error: "Price cannot be lower than cost price." });
    return;
  }
  const updated = await db.update(productsTable).set({
    name: body.name ?? existing.name,
    price: String(price),
    salePrice: salePrice === null ? null : String(salePrice),
    status: body.status ?? existing.status,
  }).where(eq(productsTable.id, req.params.id)).returning();
  await db.insert(auditLogsTable).values({ actor: "shop-owner", entity: "product", action: "updated", detail: updated[0]?.name ?? existing.name });
  const variants = await db.select().from(variantsTable).where(eq(variantsTable.productId, req.params.id));
  res.json(toAdminProduct(updated[0]!, variants));
});

router.get("/admin/orders", async (req, res) => {
  const params = ListAdminOrdersQueryParams.parse(req.query);
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const response = rows
    .filter((row) => params.status === "all" || row.fulfilmentStatus === params.status)
    .map((row) => ({
      customerName: row.customerName,
      phone: row.phone,
      address: row.address,
      distanceKm: Number(row.distanceKm),
      paymentMethod: row.paymentMethod,
      paymentReference: row.paymentReference,
      items: row.items,
      id: row.id,
      orderNumber: row.orderNumber,
      total: Number(row.total),
      paymentStatus: row.paymentStatus,
      fulfilmentStatus: row.fulfilmentStatus,
      createdAt: row.createdAt.toISOString(),
    }));
  res.json(ListAdminOrdersResponse.parse(response));
});

router.get("/admin/advance-orders", async (_req, res) => {
  const rows = await db.select().from(advanceOrdersTable).orderBy(desc(advanceOrdersTable.createdAt));
  res.json(ListAdminAdvanceOrdersResponse.parse(rows.map((row) => ({
    variantId: row.variantId,
    productName: row.productName,
    customerName: row.customerName,
    phone: row.phone,
    note: row.note,
    id: row.id,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))));
});

router.post("/admin/inventory/:variantId/adjust", async (req, res) => {
  const body = req.body;
  const variant = (await db.select().from(variantsTable).where(eq(variantsTable.id, req.params.variantId)).limit(1))[0];
  if (!variant) {
    res.status(404).json({ error: "Variant not found" });
    return;
  }
  const nextQuantity = Number(variant.quantity) + Number(body.delta);
  if (!Number.isInteger(Number(body.delta)) || nextQuantity < 0) {
    res.status(409).json({ error: "Inventory cannot go below zero." });
    return;
  }
  await db.update(variantsTable).set({ quantity: String(nextQuantity) }).where(eq(variantsTable.id, variant.id));
  await db.insert(auditLogsTable).values({ actor: "inventory-executive", entity: "inventory", action: "adjusted", detail: `${variant.sku}: ${body.reason}` });
  res.json({ variantId: variant.id, quantity: nextQuantity });
});

router.get("/admin/settings", async (_req, res) => {
  await ensureSeeded();
  const settings = (await db.select().from(storeSettingsTable).limit(1))[0];
  res.json({
    brandName: settings?.brandName ?? "India Fashions",
    shopAddress: settings?.shopAddress ?? "",
    deliveryRadiusKm: Number(settings?.deliveryRadiusKm ?? 12),
    deliveryCharge: Number(settings?.deliveryCharge ?? 99),
    codEnabled: settings?.codEnabled ?? true,
    upiEnabled: settings?.upiEnabled ?? true,
    cardEnabled: settings?.cardEnabled ?? true,
    bankTransferEnabled: settings?.bankTransferEnabled ?? true,
  });
});

router.patch("/admin/settings", async (req, res) => {
  const body = UpdateAdminSettingsBody.parse(req.body);
  const settings = (await db.select().from(storeSettingsTable).limit(1))[0];
  if (!settings) {
    res.status(404).json({ error: "Store settings not found" });
    return;
  }
  const updated = await db.update(storeSettingsTable).set({
    brandName: body.brandName,
    shopAddress: body.shopAddress,
    deliveryRadiusKm: body.deliveryRadiusKm === undefined ? undefined : String(body.deliveryRadiusKm),
    deliveryCharge: body.deliveryCharge === undefined ? undefined : String(body.deliveryCharge),
    codEnabled: body.codEnabled,
    upiEnabled: body.upiEnabled,
    cardEnabled: body.cardEnabled,
    bankTransferEnabled: body.bankTransferEnabled,
  }).where(eq(storeSettingsTable.id, settings.id)).returning();
  await db.insert(auditLogsTable).values({ actor: "shop-owner", entity: "settings", action: "updated", detail: "Store settings updated" });
  const next = updated[0]!;
  res.json(UpdateAdminSettingsResponse.parse({
    brandName: next.brandName,
    shopAddress: next.shopAddress,
    deliveryRadiusKm: Number(next.deliveryRadiusKm),
    deliveryCharge: Number(next.deliveryCharge),
    codEnabled: next.codEnabled,
    upiEnabled: next.upiEnabled,
    cardEnabled: next.cardEnabled,
    bankTransferEnabled: next.bankTransferEnabled,
  }));
});

export default router;