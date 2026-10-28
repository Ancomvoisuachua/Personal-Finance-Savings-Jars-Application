// App.jsx
import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Dashboard, Transactions, Budgets, Jars } from './pages'
import QuickAdd from './QuickAdd'

const links = [
  ['/', '📊 Tổng quan'],
  ['/transactions', '📑 Giao dịch'],
  ['/budgets', '⚡ Ngân sách'],
  ['/jars', '🏺 Hũ tiết kiệm']
]

export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-28 min-h-screen">
      <header className="flex items-center justify-between gap-3 flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💚</span>
          <h1 className="text-xl font-extrabold text-ink tracking-tight">FinTrack</h1>
        </div>
        <nav className="flex gap-1 text-xs sm:text-sm font-semibold">
          {links.map(([to, l]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-ink text-white shadow-sm' : 'text-gray-500 hover:bg-mist hover:text-ink'
                }`
              }
            >
              {l}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mt-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/jars" element={<Jars />} />
        </Routes>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-sage hover:bg-sage/90 text-white rounded-full px-6 py-3.5 font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 z-40 active:scale-95"
      >
        <span className="text-xl">+</span> Thêm giao dịch
      </button>

      {open && <QuickAdd onClose={() => setOpen(false)} />}
    </div>
  )
}