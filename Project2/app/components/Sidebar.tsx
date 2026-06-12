import { NavLink, useLocation } from "@remix-run/react";
import {
  LayoutDashboard,
  FilePlus2,
  FolderKanban,
  ShieldAlert,
  FileCheck2,
  HandCoins,
  Wallet,
  Music,
  Copyright
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/", label: "系统首页", icon: LayoutDashboard },
  { to: "/register", label: "作品登记", icon: FilePlus2 },
  { to: "/works", label: "我的作品", icon: FolderKanban },
  { to: "/monitor", label: "侵权监测", icon: ShieldAlert },
  { to: "/evidence", label: "证据中心", icon: FileCheck2 },
  { to: "/license", label: "授权交易", icon: HandCoins },
  { to: "/royalty", label: "版税结算", icon: Wallet }
];

interface SidebarProps {
  currentUser: { id: string; name: string; email: string; role: string; balance: number };
  allUsers: { id: string; name: string; email: string; role: string }[];
}

export default function Sidebar({ currentUser }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-800 text-white flex flex-col z-50 shadow-xl">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Copyright className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">版权确维权系统</h1>
            <p className="text-xs text-dark-400">区块链数字版权保护</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-dark-300 hover:bg-dark-700 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-dark-400 truncate">
                {currentUser.role === "CREATOR" ? "创作者" : "授权方"}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-dark-600">
            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-400">账户余额</span>
              <span className="text-accent-400 font-mono font-semibold">
                ¥{currentUser.balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
