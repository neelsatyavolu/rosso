"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import Link from "next/link";
import { isAppTab, useTabOptional } from "@/lib/tabs";

export function Mark({ className = "h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={className}
      aria-hidden
      fill="none"
    >
      <path d="M2 20 L14 4 L18 4 L6 20 Z" fill="#da291c" />
      <path d="M16 20 L28 4 L32 4 L20 20 Z" fill="#ffffff" />
    </svg>
  );
}

const btnBase =
  "inline-flex items-center justify-center h-12 px-8 text-[14px] font-bold uppercase tracking-[1.4px] rounded-none cursor-pointer transition-[transform,background-color,color,border-color,opacity] duration-150 active:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none";

const btnStyles = {
  primary: "bg-primary text-white hover:bg-primary-active",
  outline:
    "bg-transparent text-ink border border-white hover:bg-white hover:text-canvas",
  ghost: "bg-transparent text-ink px-0 hover:text-primary",
};

export function Button({
  variant = "primary",
  className = "",
  href,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  href?: string;
}) {
  const cls = `${btnBase} ${btnStyles[variant]} ${className}`;
  const tabs = useTabOptional();
  if (href) {
    return (
      <Link
        href={href}
        prefetch
        scroll={false}
        onClick={() => {
          if (isAppTab(href)) tabs?.select(href);
        }}
        className={cls}
      >
        {props.children}
      </Link>
    );
  }
  return <button className={cls} {...props} />;
}

export function Field({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        {label}
      </span>
      <input
        className={`mt-2 h-12 w-full bg-canvas text-ink text-[14px] px-4 rounded-[4px] border border-hairline outline-none focus:border-ink ${className}`}
        {...props}
      />
    </label>
  );
}

export function Spec({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="py-6">
      <div
        className={`font-display tabular text-[64px] md:text-[80px] font-bold leading-none tracking-[-1.6px] ${accent ? "text-primary" : "text-ink"}`}
      >
        {value}
      </div>
      <div className="mt-2 font-display text-[11px] font-semibold uppercase tracking-[1.1px] text-muted">
        {label}
      </div>
    </div>
  );
}
