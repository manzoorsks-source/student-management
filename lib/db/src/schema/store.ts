import {
  boolean,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  fabric: text("fabric").notNull(),
  description: text("description").notNull(),
  care: text("care").notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const variantsTable = pgTable("variants", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => productsTable.id),
  sku: text("sku").notNull().unique(),
  color: text("color").notNull(),
  size: text("size").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  quantity: numeric("quantity", { precision: 10, scale: 0 }).notNull().default("0"),
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 0 }).notNull().default("2"),
});

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  distanceKm: numeric("distance_km", { precision: 6, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  items: jsonb("items").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  fulfilmentStatus: text("fulfilment_status").notNull().default("placed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const advanceOrdersTable = pgTable("advance_orders", {
  id: text("id").primaryKey(),
  variantId: text("variant_id").notNull(),
  productName: text("product_name").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  note: text("note").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const storeSettingsTable = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  shopAddress: text("shop_address").notNull(),
  deliveryRadiusKm: numeric("delivery_radius_km", { precision: 6, scale: 2 }).notNull(),
  deliveryCharge: numeric("delivery_charge", { precision: 10, scale: 2 }).notNull(),
  codEnabled: boolean("cod_enabled").notNull().default(true),
  upiEnabled: boolean("upi_enabled").notNull().default(true),
  cardEnabled: boolean("card_enabled").notNull().default(true),
  bankTransferEnabled: boolean("bank_transfer_enabled").notNull().default(true),
});

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull(),
  entity: text("entity").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});