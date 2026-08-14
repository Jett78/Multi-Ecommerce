export interface GetBlogsParams {
  skip?: number;
  take?: number;
  search?: string;
  isActive?: boolean;
}

export interface BlogFormProps {
  blog?: import("./blog").Blog;
}

export interface BrandFormProps {
  brand?: import("./brand").Brand;
}

export interface BlogCardProps {
  blog: import("./blog").Blog;
  variant?: "default" | "featured";
}

export interface FileUploadProps {
  onSuccess?: (value: { key: string; url: string }) => void;
  defaultImage?: string;
  className?: string;
  returnType?: "key" | "url";
  accept?: string;
  folder?: string;
}

export interface FileUploadMultipleProps {
  onSuccess?: (value: { key: string; url: string }[]) => void;
  defaultImages?: { key: string; url: string }[];
  className?: string;
  accept?: string;
  folder?: string;
  maxFiles?: number;
  showPreview?: boolean;
}

export interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export interface TestimonialFormProps {
  testimonial?: import("./testimonial").Testimonial;
}

export interface PageSeoFormProps {
  pageSeo?: import("./page-seo").PageSeo;
}

export interface FaqFormProps {
  faq?: import("./faq").Faq;
}

export interface TeamMemberFormProps {
  teamMember?: import("./team").TeamMember;
}

export interface CategoryFormProps {
  category?: import("./category").Category;
}

export interface SubcategoryFormProps {
  subcategory?: import("./category").Subcategory;
}

export interface ProductFormProps {
  product?: import("./product").Product;
}


