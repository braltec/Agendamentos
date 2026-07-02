import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)] xl:flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-[100svh] min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}





