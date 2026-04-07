"use client";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div className={`w-full px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
}

interface PageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageTitle({ title, subtitle, className = "" }: PageTitleProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <h1 className="text-xl font-semibold text-neutral-800">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      )}
    </div>
  );
}
