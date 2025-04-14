// pages/TerminalPage.jsx
import React, { useState } from "react";
import SshTerminal from "../components/SshTerminal";
import MainLayout from "../components/layout/MainLayout";

export default function TerminalPage() {
  const [deviceId, setDeviceId] = useState(1);

  return (
    <MainLayout>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">직접 SSH 접속</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">장비 ID</label>
          <input
            type="number"
            className="border px-3 py-2 rounded w-40"
            value={deviceId}
            onChange={(e) => setDeviceId(Number(e.target.value))}
          />
        </div>
        <SshTerminal deviceId={deviceId} />
      </div>
    </MainLayout>
  );
}