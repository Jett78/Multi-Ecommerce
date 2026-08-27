import { pgTable, serial, varchar, timestamp, text, boolean, integer, numeric, doublePrecision, jsonb, uuid, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'manager', 'customer']);
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google', 'github']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  imageKey: varchar('image_key', { length: 500 }),
  role: userRoleEnum('role').default('super_admin').notNull(),
  provider: authProviderEnum('provider').default('email').notNull(),
  providerId: varchar('provider_id', { length: 255 }),
  providerData: text('provider_data'),
  isActive: boolean('is_active').default(true).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  phoneIdx: index('users_phone_idx').on(table.phone),
  isActiveIdx: index('users_is_active_idx').on(table.isActive),
  roleIdx: index('users_role_idx').on(table.role),
}));

export const companyProfiles = pgTable('company_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyDescription: text('company_description'),
  address: text('address'),
  phoneNumber: varchar('phone_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  logoKey: varchar('logo_key', { length: 500 }),
  footerLogoKey: varchar('footer_logo_key', { length: 500 }),
  faviconKey: varchar('favicon_key', { length: 500 }),
  whatsappNumber: varchar('whatsapp_number', { length: 50 }),
  googleMap: text('google_map'),
  primaryColor: varchar('primary_color', { length: 50 }),
  secondaryColor: varchar('secondary_color', { length: 50 }),
  textForeground: varchar('text_foreground', { length: 50 }),
  facebookUrl: varchar('facebook_url', { length: 500 }),
  instagramUrl: varchar('instagram_url', { length: 500 }),
  tiktokUrl: varchar('tiktok_url', { length: 500 }),
  twitterUrl: varchar('twitter_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const blogs = pgTable('blogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  imageKey: varchar('image_key', { length: 500 }),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('blogs_slug_idx').on(table.slug),
}));

export const seoMetas = pgTable('seo_metas', {
  id: uuid('id').defaultRandom().primaryKey(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  canonicalUrl: varchar('canonical_url', { length: 500 }),
  metaRobots: varchar('meta_robots', { length: 100 }).default('index, follow'),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  ogImageKey: varchar('og_image_key', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  blogId: uuid('blog_id').references(() => blogs.id, { onDelete: 'cascade' }),
  companyProfileId: uuid('company_profile_id').references(() => companyProfiles.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
});

export const blogsRelations = relations(blogs, ({ one }) => ({
  seoMeta: one(seoMetas, {
    fields: [blogs.id],
    references: [seoMetas.blogId],
  }),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({}));

export const seoMetasRelations = relations(seoMetas, ({ one }) => ({
  blog: one(blogs, {
    fields: [seoMetas.blogId],
    references: [blogs.id],
  }),
  product: one(products, {
    fields: [seoMetas.productId],
    references: [products.id],
  }),
}));

// Global SEO settings (site-wide meta, GTM, Search Console)
export const globalSeo = pgTable('global_seo', {
  id: uuid('id').defaultRandom().primaryKey(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  ogImageKey: varchar('og_image_key', { length: 500 }),
  gtmContainerId: varchar('gtm_container_id', { length: 100 }),
  googleSearchConsoleVerification: varchar('google_search_console_verification', { length: 255 }),
  googleAnalyticsId: varchar('google_analytics_id', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Per-page SEO settings
export const pageSeo = pgTable('page_seo', {
  id: uuid('id').defaultRandom().primaryKey(),
  pagePath: varchar('page_path', { length: 500 }).notNull().unique(),
  pageTitle: varchar('page_title', { length: 255 }),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  ogImageKey: varchar('og_image_key', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pagePathIdx: index('page_seo_page_path_idx').on(table.pagePath),
}));

export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  message: text('message').notNull(),
  avatar: varchar('avatar', { length: 500 }),
  designation: varchar('designation', { length: 255 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sortOrderIdx: index('testimonials_sort_order_idx').on(table.sortOrder),
}));

export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  designation: varchar('designation', { length: 255 }),
  joinedDate: timestamp('joined_date', { withTimezone: true }),
  message: text('message'),
  avatar: varchar('avatar', { length: 500 }),
  whatsappUrl: varchar('whatsapp_url', { length: 500 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('team_members_slug_idx').on(table.slug),
  sortOrderIdx: index('team_members_sort_order_idx').on(table.sortOrder),
}));

export const galleryCategories = pgEnum('gallery_category', [
  'portfolio',
  'team',
  'events',
  'behind_the_scenes',
  'testimonials',
  'other',
]);

export const gallery = pgTable('gallery', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  description: text('description'),
  images: text('images').array().notNull(),
  category: galleryCategories('category').default('other').notNull(),
  tags: text('tags').array(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('gallery_slug_idx').on(table.slug),
  categoryIdx: index('gallery_category_idx').on(table.category),
  sortOrderIdx: index('gallery_sort_order_idx').on(table.sortOrder),
}));

export const faqs = pgTable('faqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  question: varchar('question', { length: 500 }).notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sortOrderIdx: index('faqs_sort_order_idx').on(table.sortOrder),
}));

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentSettings = pgTable('payment_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull().unique(),
  secretKey: text('secret_key').notNull(),
  publicKey: text('public_key').notNull(),
  apiUrl: varchar('api_url', { length: 500 }).notNull(),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded', 'expired', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['khalti', 'cod', 'stripe']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);
export const inventoryTransactionTypeEnum = pgEnum('inventory_transaction_type', ['purchase', 'sale', 'return', 'adjustment', 'damage', 'restock']);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: varchar('order_id', { length: 255 }).notNull().unique(),
  pidx: varchar('pidx', { length: 255 }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  subtotal: integer('subtotal').notNull(),
  discountAmount: integer('discount_amount').default(0).notNull(),
  deliveryCharge: integer('delivery_charge').default(0).notNull(),
  taxAmount: integer('tax_amount').default(0).notNull(),
  totalAmount: integer('total_amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('NPR').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentMethod: paymentMethodEnum('payment_method'),
  transactionId: varchar('transaction_id', { length: 255 }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  customerName: varchar('customer_name', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  landmark: text('landmark'),
  notes: text('notes'),
  metadata: text('metadata'),
  couponId: uuid('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
  courierProvider: varchar('courier_provider', { length: 50 }),
  courierConsignmentId: varchar('courier_consignment_id', { length: 255 }),
  courierTrackingUrl: varchar('courier_tracking_url', { length: 512 }),
  courierStatus: varchar('courier_status', { length: 50 }),
  deliveryType: varchar('delivery_type', { length: 50 }),
  district: varchar('district', { length: 100 }),
  parcelWeightKg: doublePrecision('parcel_weight_kg'),
  estimatedDeliveryDays: integer('estimated_delivery_days'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('orders_order_id_idx').on(table.orderId),
  pidxIdx: index('orders_pidx_idx').on(table.pidx),
  userIdIdx: index('orders_user_id_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
}));

// Better Auth tables
export const addressTypeEnum = pgEnum('address_type', ['home', 'office', 'other']);

export const shippingAddresses = pgTable('shipping_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: addressTypeEnum('type').default('home').notNull(),
  label: varchar('label', { length: 100 }),
  provinceId: integer('province_id').notNull(),
  provinceName: varchar('province_name', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  municipality: varchar('municipality', { length: 100 }).notNull(),
  landmark: text('landmark'),
  streetAddress: text('street_address').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('shipping_addresses_user_id_idx').on(table.userId),
}));

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: varchar('role', { length: 50 }).default('customer').notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  password: text('password'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  idTokenClaims: text('id_token_claims'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Custom Domains
export const domainStatusEnum = pgEnum('domain_status', ['pending', 'verifying', 'verified', 'active', 'failed']);
export const sslStatusEnum = pgEnum('ssl_status', ['pending', 'active', 'failed', 'none']);
export const deploymentStatusEnum = pgEnum('deployment_status', ['pending', 'deploying', 'deployed', 'failed']);

export const customDomains = pgTable('custom_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  status: domainStatusEnum('status').default('pending').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  sslStatus: sslStatusEnum('ssl_status').default('none').notNull(),
  sslIssuedAt: timestamp('ssl_issued_at', { withTimezone: true }),
  deploymentStatus: deploymentStatusEnum('deployment_status').default('pending').notNull(),
  errorMessage: text('error_message'),
  dnsRecordsChecked: text('dns_records_checked'),
  dokployDomainId: varchar('dokploy_domain_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  domainIdx: index('custom_domains_domain_idx').on(table.domain),
  statusIdx: index('custom_domains_status_idx').on(table.status),
}));

export const redirects = pgTable('redirects', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromPath: varchar('from_path', { length: 500 }).notNull().unique(),
  toPath: varchar('to_path', { length: 500 }).notNull(),
  statusCode: integer('status_code').default(301).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fromPathIdx: index('redirects_from_path_idx').on(table.fromPath),
  isActiveIdx: index('redirects_is_active_idx').on(table.isActive),
}));

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  key: varchar('key', { length: 150 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  resourceActionIdx: index('permissions_resource_action_idx').on(table.resource, table.action),
  keyIdx: index('permissions_key_idx').on(table.key),
}));

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  role: varchar('role', { length: 50 }).notNull(),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  rolePermissionIdx: index('role_permissions_role_permission_idx').on(table.role, table.permissionId),
  uniqueRolePermission: index('unique_role_permission_idx').on(table.role, table.permissionId),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const navigationItems = pgTable('navigation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  label: varchar('label', { length: 100 }).notNull(),
  path: varchar('path', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('navigation_items_key_idx').on(table.key),
  sortOrderIdx: index('navigation_items_sort_order_idx').on(table.sortOrder),
}));

export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  imageKey: varchar('image_key', { length: 500 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sortOrderIdx: index('brands_sort_order_idx').on(table.sortOrder),
  isActiveIdx: index('brands_is_active_idx').on(table.isActive),
}));

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  imageKey: varchar('image_key', { length: 500 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('categories_slug_idx').on(table.slug),
  sortOrderIdx: index('categories_sort_order_idx').on(table.sortOrder),
}));

export const subcategories = pgTable('subcategories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  imageKey: varchar('image_key', { length: 500 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('subcategories_slug_idx').on(table.slug),
  categoryIdIdx: index('subcategories_category_id_idx').on(table.categoryId),
  sortOrderIdx: index('subcategories_sort_order_idx').on(table.sortOrder),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
}));

export const subcategoriesRelations = relations(subcategories, ({ one }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
}));

// ============================================================
// PRODUCTS & VARIANTS
// ============================================================

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  subcategoryId: uuid('subcategory_id').references(() => subcategories.id, { onDelete: 'set null' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  sku: varchar('sku', { length: 100 }).unique(),
  status: productStatusEnum('status').default('draft').notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  tags: text('tags').array(),
  isActive: boolean('is_active').default(true).notNull(),
  // Variant fields — used directly when product has no variants.
  price: integer('price').default(0),
  compareAtPrice: integer('compare_at_price'),
  costPrice: integer('cost_price'),
  stockQuantity: integer('stock_quantity').default(0),
  allowBackorder: boolean('allow_backorder').default(false),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  weight: integer('weight'),
  barcode: varchar('barcode', { length: 100 }),
  // Rating fields (denormalized for performance)
  averageRating: integer('average_rating').default(0).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
  categoryIdIdx: index('products_category_id_idx').on(table.categoryId),
  subcategoryIdIdx: index('products_subcategory_id_idx').on(table.subcategoryId),
  brandIdIdx: index('products_brand_id_idx').on(table.brandId),
  statusIdx: index('products_status_idx').on(table.status),
  isFeaturedIdx: index('products_is_featured_idx').on(table.isFeatured),
  skuIdx: index('products_sku_idx').on(table.sku),
  sortOrderIdx: index('products_sort_order_idx').on(table.sortOrder),
  averageRatingIdx: index('products_average_rating_idx').on(table.averageRating),
}));

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: varchar('sku', { length: 100 }).unique(),
  price: integer('price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  costPrice: integer('cost_price'),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  allowBackorder: boolean('allow_backorder').default(false).notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5),
  weight: integer('weight'),
  barcode: varchar('barcode', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('product_variants_product_id_idx').on(table.productId),
  skuIdx: index('product_variants_sku_idx').on(table.sku),
  barcodeIdx: index('product_variants_barcode_idx').on(table.barcode),
  isActiveIdx: index('product_variants_is_active_idx').on(table.isActive),
}));

export const variantAttributes = pgTable('variant_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  attributeName: varchar('attribute_name', { length: 100 }).notNull(),
  attributeValue: varchar('attribute_value', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => ({
  variantIdIdx: index('variant_attributes_variant_id_idx').on(table.variantId),
  compoundIdx: index('variant_attributes_compound_idx').on(table.variantId, table.attributeName),
}));

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  imageKey: varchar('image_key', { length: 500 }).notNull(),
  altText: varchar('alt_text', { length: 255 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('product_images_product_id_idx').on(table.productId),
  variantIdIdx: index('product_images_variant_id_idx').on(table.variantId),
  primaryIdx: index('product_images_primary_idx').on(table.productId, table.isPrimary),
}));

// ============================================================
// REVIEWS
// ============================================================

export const productReviews = pgTable('product_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  images: text('images').array().default([]).notNull(),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index('product_reviews_product_id_idx').on(table.productId),
  userIdIdx: index('product_reviews_user_id_idx').on(table.userId),
  ratingIdx: index('product_reviews_rating_idx').on(table.rating),
  isApprovedIdx: index('product_reviews_is_approved_idx').on(table.isApproved),
}));

export const reviewReplies = pgTable('review_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewId: uuid('review_id').notNull().references(() => productReviews.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): any => reviewReplies.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  comment: text('comment').notNull(),
  isAdminReply: boolean('is_admin_reply').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  reviewIdIdx: index('review_replies_review_id_idx').on(table.reviewId),
  parentIdIdx: index('review_replies_parent_id_idx').on(table.parentId),
  userIdIdx: index('review_replies_user_id_idx').on(table.userId),
}));

// ============================================================
// INVENTORY
// ============================================================

export const inventoryTransactions = pgTable('inventory_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  type: inventoryTransactionTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantIdIdx: index('inventory_transactions_variant_id_idx').on(table.variantId),
  typeIdx: index('inventory_transactions_type_idx').on(table.type),
  createdAtIdx: index('inventory_transactions_created_at_idx').on(table.createdAt),
}));

// ============================================================
// CART
// ============================================================

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  sessionId: varchar('session_id', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('carts_user_id_idx').on(table.userId),
  sessionIdIdx: index('carts_session_id_idx').on(table.sessionId),
  expiresAtIdx: index('carts_expires_at_idx').on(table.expiresAt),
}));

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  priceAtAdd: integer('price_at_add').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartIdIdx: index('cart_items_cart_id_idx').on(table.cartId),
  variantIdIdx: index('cart_items_variant_id_idx').on(table.variantId),
}));

// ============================================================
// ORDER ITEMS
// ============================================================

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 500 }).notNull(),
  variantName: varchar('variant_name', { length: 500 }),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
  discountAmount: integer('discount_amount').default(0).notNull(),
  taxAmount: integer('tax_amount').default(0).notNull(),
  totalAmount: integer('total_amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  variantIdIdx: index('order_items_variant_id_idx').on(table.variantId),
}));

// ============================================================
// RELATIONS
// ============================================================

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  seoMeta: one(seoMetas, {
    fields: [products.id],
    references: [seoMetas.productId],
  }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(productReviews),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  attributes: many(variantAttributes),
  images: many(productImages),
  inventoryTransactions: many(inventoryTransactions),
}));

export const variantAttributesRelations = relations(variantAttributes, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantAttributes.variantId],
    references: [productVariants.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one, many }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  replies: many(reviewReplies),
}));

export const reviewRepliesRelations = relations(reviewReplies, ({ one, many }) => ({
  review: one(productReviews, {
    fields: [reviewReplies.reviewId],
    references: [productReviews.id],
  }),
  parent: one(reviewReplies, {
    fields: [reviewReplies.parentId],
    references: [reviewReplies.id],
    relationName: 'replyReplies',
  }),
  replies: many(reviewReplies, { relationName: 'replyReplies' }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryTransactions.variantId],
    references: [productVariants.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const couponTypeEnum = pgEnum('coupon_type', ['fixed', 'percentage', 'free_shipping']);

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: couponTypeEnum('type').notNull(),
  value: integer('value').notNull().default(0),
  minOrderAmount: integer('min_order_amount'),
  maxDiscountAmount: integer('max_discount_amount'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0).notNull(),
  perUserLimit: integer('per_user_limit'),
  productIds: uuid('product_ids').array(),
  categoryIds: uuid('category_ids').array(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('coupons_code_idx').on(table.code),
  isActiveIdx: index('coupons_is_active_idx').on(table.isActive),
  expiresAtIdx: index('coupons_expires_at_idx').on(table.expiresAt),
}));

export const orderCoupons = pgTable('order_coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'restrict' }),
  couponCode: varchar('coupon_code', { length: 50 }).notNull(),
  discountAmount: integer('discount_amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orderIdIdx: index('order_coupons_order_id_idx').on(table.orderId),
  couponIdIdx: index('order_coupons_coupon_id_idx').on(table.couponId),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  orderCoupons: many(orderCoupons),
}));

export const orderCouponsRelations = relations(orderCoupons, ({ one }) => ({
  order: one(orders, {
    fields: [orderCoupons.orderId],
    references: [orders.id],
  }),
  coupon: one(coupons, {
    fields: [orderCoupons.couponId],
    references: [coupons.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  items: many(orderItems),
  orderCoupons: many(orderCoupons),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

// ============================================================
// COURIER / DELIVERY
// ============================================================

export const courierSettings = pgTable('courier_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  apiBaseUrl: varchar('api_base_url', { length: 500 }).notNull(),
  credentials: text('credentials').notNull(),
  config: text('config'),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courierCities = pgTable('courier_cities', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  courierId: integer('courier_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  providerIdx: index('courier_cities_provider_idx').on(table.provider),
}));

export const courierZones = pgTable('courier_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  cityId: uuid('city_id').references(() => courierCities.id, { onDelete: 'cascade' }),
  courierId: integer('courier_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  providerIdx: index('courier_zones_provider_idx').on(table.provider),
  cityIdIdx: index('courier_zones_city_id_idx').on(table.cityId),
}));

export const courierAreas = pgTable('courier_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  zoneId: uuid('zone_id').references(() => courierZones.id, { onDelete: 'cascade' }),
  courierId: integer('courier_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  homeDelivery: boolean('home_delivery').default(false).notNull(),
  pickup: boolean('pickup').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  providerIdx: index('courier_areas_provider_idx').on(table.provider),
  zoneIdIdx: index('courier_areas_zone_id_idx').on(table.zoneId),
}));

export const courierBranches = pgTable('courier_branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  district: varchar('district', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  providerIdx: index('courier_branches_provider_idx').on(table.provider),
}));

export const courierDistrictMappings = pgTable('courier_district_mappings', {
  id: uuid('id').defaultRandom().primaryKey(),
  district: varchar('district', { length: 100 }).notNull(),
  provinceId: integer('province_id').notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  courierCityId: integer('courier_city_id'),
  courierCityName: varchar('courier_city_name', { length: 255 }),
  courierAreaId: integer('courier_area_id'),
  courierAreaName: varchar('courier_area_name', { length: 255 }),
  courierBranch: varchar('courier_branch', { length: 255 }),
  deliveryChargeOverrides: jsonb('delivery_charge_overrides'),
  isMapped: boolean('is_mapped').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  districtProviderIdx: index('mappings_district_provider_idx').on(table.district, table.provider),
  providerIdx: index('mappings_provider_idx').on(table.provider),
}));
