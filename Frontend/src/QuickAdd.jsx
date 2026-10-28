// QuickAdd.jsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addTransaction, getCategories } from './api'

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000]

export default function QuickAdd({ onClose }) {
  const qc = useQueryClient()
  const { data: cats = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  
  const [type, setType] = useState('expense')
  const [amountRaw, setAmountRaw] = useState('')
  const [f, setF] = useState({
    category_id: null,
    note: '',
    date: new Date().toISOString().slice(0, 10)
  })

  const m = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      qc.invalidateQueries()
      onClose()
    }
  })

  const shownCats = cats.filter((c) => c.type === type)
  const numericAmount = Number(amountRaw)
  const isValid = f.category_id && numericAmount > 0

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    setAmountRaw(val)
  }

  const addQuickAmount = (val) => {
    const current = Number(amountRaw) || 0
    setAmountRaw(String(current + val))
  }

  const formatDisplayAmount = (valStr) => {
    if (!valStr) return ''
    return Number(valStr).toLocaleString('vi-VN')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50 animate-fadeIn" onClick={onClose}>
      <div 
        role="dialog" 
        aria-label="Thêm giao dịch" 
        className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-lg text-ink">Thêm giao dịch mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-ink text-xl">✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-mist rounded-xl">
          {[['expense', '💸 Chi tiêu'], ['income', '💰 Thu nhập']].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setType(v)
                setF({ ...f, category_id: null })
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                type === v ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Category Selector */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Danh mục</label>
          <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
            {shownCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setF({ ...f, category_id: c.id })}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  f.category_id === c.id 
                    ? 'border-sage bg-sage/10 text-sage ring-2 ring-sage/20' 
                    : 'border-gray-100 bg-mist/50 hover:bg-mist text-ink'
                }`}
              >
                <span className="text-2xl mb-1">{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Số tiền (VNĐ)</label>
          <div className="relative">
            <input
              autoFocus
              inputMode="numeric"
              placeholder="0"
              value={formatDisplayAmount(amountRaw)}
              onChange={handleAmountChange}
              className="w-full border-2 border-gray-100 focus:border-sage rounded-xl p-3 text-2xl font-bold text-ink outline-none pr-10"
            />
            <span className="absolute right-4 top-4 font-bold text-gray-400">đ</span>
          </div>
          
          {/* Quick Amounts */}
          <div className="flex gap-1.5 flex-wrap mt-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => addQuickAmount(amt)}
                className="text-xs px-2.5 py-1 rounded-lg bg-mist hover:bg-gray-200 text-ink font-medium"
              >
                +{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
            {amountRaw && (
              <button
                type="button"
                onClick={() => setAmountRaw('')}
                className="text-xs px-2.5 py-1 rounded-lg bg-alert/10 text-alert font-medium ml-auto"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Note & Date */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Ghi chú</label>
            <input
              placeholder="Ví dụ: Ăn trưa..."
              maxLength={60}
              value={f.note}
              onChange={(e) => setF({ ...f, note: e.target.value })}
              className="w-full border border-gray-200 focus:border-sage rounded-xl p-2.5 text-sm outline-none bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Ngày</label>
            <input
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
              className="w-full border border-gray-200 focus:border-sage rounded-xl p-2.5 text-sm outline-none bg-white"
            />
          </div>
        </div>

        {m.error && <p className="text-alert text-xs font-medium">{m.error.message}</p>}

        <button
          disabled={!isValid || m.isPending}
          onClick={() => m.mutate({ ...f, type, amount: numericAmount })}
          className="w-full bg-sage hover:bg-sage/90 text-white py-3.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-40"
        >
          {m.isPending ? 'Đang lưu...' : 'Lưu giao dịch'}
        </button>
      </div>
    </div>
  )
}