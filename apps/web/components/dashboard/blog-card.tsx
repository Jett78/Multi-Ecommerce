"use client";

import { Calendar, FileText } from "lucide-react";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { EditButton } from "@/components/dashboard/edit-button";
import { revalidateBlogs } from "@/actions/revalidate-action";
import { API_ROUTES } from "@/config/api-routes";
import Image from "next/image";
import type { Blog } from "@/types/blog";

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="aspect-video relative bg-slate-100 overflow-hidden">
        {blog.imageKey ? (
          <Image
            src={blog.imageKey}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <FileText className="size-12 text-foreground" />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight">
            {blog.title}
          </h3>
          <span
            className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              blog.isActive
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-slate-50 text-slate-600 border-slate-100"
            }`}
          >
            {blog.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <p className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-1">
          /{blog.slug}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <Calendar className="size-3.5" />
          {new Date(blog.createdAt).toLocaleDateString()}
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
          <EditButton href={`/dashboard/blogs/${blog.id}/edit`} />
          <DeleteButton
            id={blog.id}
            endpoint={API_ROUTES.BLOG}
            queryKey="blogs"
            entityName="blog"
            onSuccess={revalidateBlogs}
          />
        </div>
      </div>
    </div>
  );
}
