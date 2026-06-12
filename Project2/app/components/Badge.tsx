interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "default" | "accent";
  size?: "sm" | "md";
}

const variantClasses = {
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
  accent: "bg-amber-100 text-amber-700 border-amber-200"
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm"
};

export default function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}
