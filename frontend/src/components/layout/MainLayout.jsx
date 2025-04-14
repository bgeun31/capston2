// components/layout/MainLayout.jsx
import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
  const [dark, setDark] = useState(false);

  return (
    <div className={`${dark ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-800"} min-h-screen`}>
      <Header onToggleDark={() => setDark(!dark)} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 max-w-screen-xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}