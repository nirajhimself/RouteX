import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark-900 dark:bg-dark-900 light:bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-52">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        {/* 52px navbar + 24px ticker = 76px */}
        <main className="pt-[76px] px-5 pb-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
