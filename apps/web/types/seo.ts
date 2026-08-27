import { CommonResponse } from "./base-entity";

export interface GlobalSeo {
  id: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageKey?: string;
  gtmContainerId?: string;
  googleSearchConsoleVerification?: string;
  googleAnalyticsId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageKey?: string;
  gtmContainerId?: string;
  googleSearchConsoleVerification?: string;
  googleAnalyticsId?: string;
}

export type GlobalSeoResponse = CommonResponse<GlobalSeo>;
