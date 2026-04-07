"use client";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
}

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export function PageContainer({
  children,
  maxWidth = "4xl",
  className = "",
}: PageContainerProps) {
  return (
    <div className={`p-6 mx-auto ${maxWidthClasses[maxWidth]} ${className}`}>
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
