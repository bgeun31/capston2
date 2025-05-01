import Link from "next/link"
import { Home, Terminal, Shield, FileText } from "lucide-react"

export default function Sidebar() {
  return (
    <div className="w-48 bg-gray-100 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">네트워크</h2>
      </div>
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          <li>
            <Link href="/" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
              <Home size={18} />
              <span>대시보드</span>
            </Link>
          </li>
          <li>
            <Link href="/terminal" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
              <Terminal size={18} />
              <span>SSH 터미널</span>
            </Link>
          </li>
          <li>
            <Link href="/ids" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
              <Shield size={18} />
              <span>IDS</span>
            </Link>
          </li>
          <li>
            <Link href="/logs" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 bg-blue-100">
              <FileText size={18} />
              <span>로그</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
