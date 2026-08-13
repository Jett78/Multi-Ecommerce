"use server";

import { revalidateTag } from "next/cache";

export async function revalidateBlogs() {
  revalidateTag("blogs", "max");
}

export async function revalidateBlog(slug: string) {
  revalidateTag("blogs", "max");
  revalidateTag(`blog-${slug}`, "max");
}

export async function revalidateCompanyProfile() {
  revalidateTag("company-profile", "max");
}

export async function revalidateTestimonials() {
  revalidateTag("testimonials", "max");
}

export async function revalidateFaqs() {
  revalidateTag("faqs", "max");
}

export async function revalidateTeamMembers() {
  revalidateTag("team-members", "max");
}

export async function revalidateTeamMember(slug: string) {
  revalidateTag("team-members", "max");
  revalidateTag(`team-member-${slug}`, "max");
}

export async function revalidateRedirects() {
  revalidateTag("redirects", "max");
}

export async function revalidateNavigation() {
  revalidateTag("navigation", "max");
}

export async function revalidateBrands() {
  revalidateTag("brands", "max");
}

export async function revalidateCategories() {
  revalidateTag("categories", "max");
}

export async function revalidateCategory(slug: string) {
  revalidateTag("categories", "max");
  revalidateTag(`category-${slug}`, "max");
}

export async function revalidateSubcategories() {
  revalidateTag("subcategories", "max");
}

export async function revalidateProducts() {
  revalidateTag("products", "max");
}

export async function revalidateProduct(slug: string) {
  revalidateTag("products", "max");
  revalidateTag(`product-${slug}`, "max");
}
