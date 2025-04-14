// components/layout/Header.jsx
import React from "react";
import { Bell, Settings, Moon, Sun } from "lucide-react";

export default function Header({ onToggleDark }) {
  return (
    <header className="w-full bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">네트워크 모니터링 시스템</h1>
      <div className="flex gap-4 items-center">
        <button
          onClick={onToggleDark}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Moon className="hidden dark:inline-block" size={20} />
          <Sun className="dark:hidden" size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <Settings size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}