"use client";

import { FileText } from "lucide-react";
import type { PageSeo } from "@/types/page-seo";
import NoData from "@/components/no-data";
import Link from "next/link";
import { EditButton } from "@/components/dashboard/edit-button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { API_ROUTES } from "@/config/api-routes";

interface PageSeoManagerProps {
  pages: PageSeo[];
  isLoading?: boolean;
}

export function PageSeoManager({ pages, isLoading }: PageSeoManagerProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <NoData title="page SEO entries" />
        ) : (
          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-primarymain/30 hover:bg-primarymain/5 transition-all group"
              >
                <Link
                  href={`/dashboard/page-seo/${page.pagePath}/edit`}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primarymain/10 transition-colors">
                    <FileText className="h-4 w-4 text-slate-500 group-hover:text-primarymain" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{page.pageTitle || page.pagePath}</p>
                    <p className="text-xs text-slate-500 font-mono">{page.pagePath}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <EditButton href={`/dashboard/page-seo/${page.pagePath}/edit`} />
                  <DeleteButton
                    id={page.pagePath}
                    endpoint={API_ROUTES.PAGE_SEO}
                    queryKey="page-seo"
                    entityName="page SEO"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
