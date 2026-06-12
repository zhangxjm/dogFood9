import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  gradient?: string;
}

export default function StatCard({ title, value, icon, trend, gradient = "from-primary-600 to-primary-800" }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`mt-2 text-sm flex items-center gap-1 ${trend.positive ? "text-green-300" : "text-red-300"}`}>
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
