"use client";

import { ReactNode } from "react";

export default function SeniorOfficerLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        {subtitle ? <p className="text-gray-600">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

