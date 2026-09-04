"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  path?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

const PrimaryButton: React.FC<Props> = ({
  text,
  path,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  variant = "primary",
}) => {
  const baseClasses = cn(
    "relative text-sm font-bold tracking-wide bg-gray-900 px-6 py-3 text-white transition-colors hover:bg-gray-800",
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
    className
  );

  const content = <span className="relative z-10">{text}</span>;

  if (path) {
    return (
      <Link href={path} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {content}
    </button>
  );
};

export default PrimaryButton;
