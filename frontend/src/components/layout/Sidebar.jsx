// components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Network, TerminalSquare, FileText } from "lucide-react";

const menuItems = [
  { icon: <Home size={18} />, label: "대시보드", href: "/" },
  { icon: <Network size={18} />, label: "토폴로지", href: "/topology" },
  { icon: <TerminalSquare size={18} />, label: "SSH 터미널", href: "/terminal" },
  { icon: <FileText size={18} />, label: "로그", href: "/logs" }, // 추가
];

export default function Sidebar() {
  return (
    <div className="w-60 min-h-screen bg-white dark:bg-gray-900 border-r px-4 py-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📡 네트워크</h2>
      <ul className="space-y-2">
        {menuItems.map((item, idx) => (
          <li key={idx}>
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}