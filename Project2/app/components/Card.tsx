interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingClasses = {
  sm: "p-3",
  md: "p-5",
  lg: "p-7"
};

export default function Card({ children, className = "", padding = "md", hover = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-dark-200 ${
      hover ? "shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer" : "shadow-card"
    } ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
