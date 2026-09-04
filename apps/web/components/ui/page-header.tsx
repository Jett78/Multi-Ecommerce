import React from "react";
import { cn } from "@/lib/utils";

type titleprops = {
  title: string;
  subtitle?: string;
  desc?: string;
  className?: string;
};

const PageHeader = ({ title, subtitle, desc, className }: titleprops) => {
  return (
    <div className="flex flex-col space-y-1 items-center justify-center">
      {subtitle && (
        <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">{subtitle}</p>
      )}
      <h2
        className={cn(
          className,
          "text-xl md:text-2xl font-bold tracking-tight text-gray-900 text-center"
        )}
      >
        {title}
      </h2>
      {desc && (
        <p className="text-sm text-center text-gray-500 max-w-lg">{desc}</p>
      )}
    </div>
  );
};

export default PageHeader;
