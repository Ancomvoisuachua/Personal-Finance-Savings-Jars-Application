// pages.jsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  getDashboard, 
  getTransactions, 
  getCategories, 
  deleteTransaction, 
  getJars, 
  createJar, 
  moveJar, 
  addBudget 
} from './api'

const vnd = (n) => (n || 0).toLocaleString('vi-VN') + ' đ'
const colorMap = { ok: 'bg-sage', warning: 'bg-amber', exceeded: 'bg-alert' }

const Bar = ({ pct, cls }) => (
  <div className="h-2.5 rounded-full bg-mist overflow-hidden">
    <div className={`h-full transition-all duration-300 ${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
)

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
)

// Thành phần Biểu đồ Phân tích Chi tiêu dạng Visual Bars
function CategorySpendingChart({ data }) {
  if (!data || !data.length) return <p className="text-sm text-gray-400">Chưa có dữ liệu chi tiêu tháng này.</p>

  const colors = ['bg-sage', 'bg-amber', 'bg-sky-500', 'bg-indigo-500', 'bg-rose-400']

  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <span>{item.icon}</span> {item.name}
            </span>
            <span className="font-semibold text-gray-700">{vnd(item.amount)} ({item.percentage}%)</span>
          </div>
          <Bar pct={item.percentage} cls={colors[idx % colors.length]} />
        </div>
      ))}
    </div>
  )
}

function BudgetList({ items, filterPeriod = 'all' }) {
  const filtered = filterPeriod === 'all' ? items : items.filter((b) => b.period_type === filterPeriod)

  if (!filtered.length) return <p className="text-sm text-gray-400">Chưa có hạn mức nào trong mục này.</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {filtered.map((b) => (
        <Card key={`${b.category_id}-${b.period_type}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold flex items-center gap-2">
              <span className="text-xl">{b.category?.icon}</span> {b.category?.name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              b.period_type === 'daily' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
            }`}>
              {b.period_type === 'daily' ? 'Hàng ngày' : 'Hàng tháng'}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>Đã dùng: {vnd(b.spent)}</span>
            <span>Hạn mức: {vnd(b.limit_amount)}</span>
          </div>
          <Bar pct={b.percent_used} cls={colorMap[b.warning_level]} />
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-600">{b.percent_used}% hạn mức</span>
            {b.is_exceeded && (
              <span className="text-alert font-bold">Vượt {vnd(b.spent - b.limit_amount)}</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

function JarCard({ j }) {
  const qc = useQueryClient()
  const pct = Math.round((j.current_amount / j.target_amount) * 100)
  const m = useMutation({ mutationFn: moveJar, onSuccess: () => qc.invalidateQueries() })

  const ask = (sign) => {
    const action = sign > 0 ? 'Nạp' : 'Rút'
    const input = prompt(`[${j.name}]\nNhập số tiền muốn ${action.toLowerCase()} (VNĐ):`)
    if (!input) return
    const val = Number(input.replace(/\D/g, ''))
    if (val > 0) m.mutate({ id: j.id, amount: sign * val })
  }

  return (
    <Card className="flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-ink text-base">{j.name}</h4>
          <span className="text-xs font-bold bg-sage/10 text-sage px-2 py-1 rounded-lg">{pct}%</span>
        </div>
        <Bar pct={pct} cls="bg-sage" />
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>Đã tích lũy: <b className="text-ink">{vnd(j.current_amount)}</b> / {vnd(j.target_amount)}</div>
          {j.deadline && <div>Hạn hoàn thành: {j.deadline}</div>}
          {j.allocation_percentage > 0 && (
            <div className="text-sage font-medium">⚡ Tự động trích {j.allocation_percentage}% khi có thu nhập</div>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-50">
        <button onClick={() => ask(1)} className="flex-1 py-1.5 rounded-xl bg-sage hover:bg-sage/90 text-white font-medium text-xs transition-all">
          + Nạp tiền
        </button>
        <button onClick={() => ask(-1)} className="flex-1 py-1.5 rounded-xl bg-mist hover:bg-gray-200 text-ink font-medium text-xs transition-all">
          - Rút tiền
        </button>
      </div>
      {m.error && <p className="text-alert text-xs font-medium">{m.error.message}</p>}
    </Card>
  )
}

// DASHBOARD PAGE
export function Dashboard() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (!data) return <div className="p-8 text-center text-gray-400">Đang tải dữ liệu tài chính...</div>

  const { summary, budgets, jars, spendingByCategory } = data

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-xs font-semibold text-gray-400 uppercase">Thu nhập tháng</div>
          <div className="text-sm sm:text-lg font-bold text-sage mt-1">+{vnd(summary.totalIncome)}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs font-semibold text-gray-400 uppercase">Chi tiêu tháng</div>
          <div className="text-sm sm:text-lg font-bold text-alert mt-1">-{vnd(summary.totalExpense)}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xs font-semibold text-gray-400 uppercase">Thặng dư (Tiết kiệm)</div>
          <div className={`text-sm sm:text-lg font-bold mt-1 ${summary.netSavings >= 0 ? 'text-ink' : 'text-alert'}`}>
            {vnd(summary.netSavings)}
          </div>
        </Card>
      </div>

      {/* Spending Analytics Chart */}
      <Card>
        <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
          <span>📊</span> Phân tích chi tiêu tháng này
        </h3>
        <CategorySpendingChart data={spendingByCategory} />
      </Card>

      {/* Daily/Monthly Budgets */}
      <section>
        <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
          <span>⚡</span> Hạn mức ngân sách
        </h3>
        <BudgetList items={budgets} />
      </section>

      {/* Savings Jars */}
      <section>
        <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
          <span>🏺</span> Các hũ tiết kiệm
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {jars.map((j) => (
            <JarCard key={j.id} j={j} />
          ))}
        </div>
      </section>
    </div>
  )
}

// TRANSACTIONS PAGE
export function Transactions() {
  const qc = useQueryClient()
  const { data: txs = [] } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions })
  const { data: cats = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const del = useMutation({ mutationFn: deleteTransaction, onSuccess: () => qc.invalidateQueries() })

  if (!txs.length) return <Card className="text-center py-8 text-gray-400">Chưa có giao dịch nào được ghi chép.</Card>

  return (
    <Card className="p-2 divide-y divide-gray-100">
      {txs.map((t) => {
        const c = cats.find((x) => x.id === t.category_id)
        const isIncome = t.type === 'income'

        return (
          <div key={t.id} className="flex items-center justify-between p-3 hover:bg-mist/50 rounded-xl transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-mist rounded-xl">{c?.icon || '💵'}</span>
              <div>
                <div className="font-bold text-sm text-ink">{t.note || c?.name}</div>
                <div className="text-xs text-gray-400">{t.date} · {c?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${isIncome ? 'text-sage' : 'text-ink'}`}>
                {isIncome ? '+' : '-'}{vnd(t.amount)}
              </span>
              <button
                aria-label="Xóa giao dịch"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa giao dịch này?')) del.mutate(t.id)
                }}
                className="text-gray-300 hover:text-alert p-1 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

// BUDGETS PAGE
export function Budgets() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const { data: cats = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  
  const [tab, setTab] = useState('all')
  const [f, setF] = useState({ category_id: '', limit_amount: '', period_type: 'daily' })

  const addM = useMutation({
    mutationFn: addBudget,
    onSuccess: () => {
      qc.invalidateQueries()
      setF({ category_id: '', limit_amount: '', period_type: 'daily' })
    }
  })

  const expenseCats = cats.filter(c => c.type === 'expense')

  return (
    <div className="space-y-6">
      {/* Form Tạo / Đặt Hạn Mức */}
      <Card>
        <h3 className="font-bold text-ink mb-3">Thiết lập hạn mức ngân sách</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={f.category_id}
            onChange={(e) => setF({ ...f, category_id: Number(e.target.value) })}
            className="border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
          >
            <option value="">-- Chọn danh mục --</option>
            {expenseCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <select
            value={f.period_type}
            onChange={(e) => setF({ ...f, period_type: e.target.value })}
            className="border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
          >
            <option value="daily">Theo ngày</option>
            <option value="monthly">Theo tháng</option>
          </select>

          <input
            placeholder="Hạn mức (VNĐ)"
            inputMode="numeric"
            value={f.limit_amount ? Number(f.limit_amount).toLocaleString('vi-VN') : ''}
            onChange={(e) => setF({ ...f, limit_amount: e.target.value.replace(/\D/g, '') })}
            className="border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
          />

          <button
            disabled={!f.category_id || !f.limit_amount}
            onClick={() => addM.mutate({ ...f, limit_amount: Number(f.limit_amount) })}
            className="bg-ink text-white rounded-xl py-2.5 font-medium text-sm disabled:opacity-40 hover:bg-ink/90 transition-all"
          >
            Lưu hạn mức
          </button>
        </div>
      </Card>

      {/* Filter Tabs & List */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {[['all', 'Tất cả'], ['daily', 'Hàng ngày'], ['monthly', 'Hàng tháng']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === v ? 'bg-ink text-white' : 'bg-white text-gray-500 hover:bg-mist'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {data ? <BudgetList items={data.budgets} filterPeriod={tab} /> : <p className="text-gray-400">Đang tải...</p>}
      </div>
    </div>
  )
}

// JARS PAGE
export function Jars() {
  const qc = useQueryClient()
  const { data: jars = [] } = useQuery({ queryKey: ['jars'], queryFn: getJars })
  
  const [f, setF] = useState({ name: '', target_amount: '', allocation_percentage: 0, deadline: '' })

  const m = useMutation({
    mutationFn: createJar,
    onSuccess: () => {
      qc.invalidateQueries()
      setF({ name: '', target_amount: '', allocation_percentage: 0, deadline: '' })
    }
  })

  return (
    <div className="space-y-6">
      {/* Form Tạo Hũ mới */}
      <Card>
        <h3 className="font-bold text-ink mb-3">Tạo Hũ tiết kiệm mới</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            placeholder="Tên hũ (Ví dụ: Mua Laptop, Đi du lịch...)"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            className="border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
          />
          <input
            placeholder="Mục tiêu tích lũy (VNĐ)"
            inputMode="numeric"
            value={f.target_amount ? Number(f.target_amount).toLocaleString('vi-VN') : ''}
            onChange={(e) => setF({ ...f, target_amount: e.target.value.replace(/\D/g, '') })}
            className="border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tự động trích từ Thu Nhập (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={f.allocation_percentage}
              onChange={(e) => setF({ ...f, allocation_percentage: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Hạn dự kiến (nếu có)</label>
            <input
              type="date"
              value={f.deadline}
              onChange={(e) => setF({ ...f, deadline: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white"
            />
          </div>
          <div className="flex items-end">
            <button
              disabled={!f.name || !f.target_amount}
              onClick={() => m.mutate({ ...f, target_amount: Number(f.target_amount) })}
              className="w-full bg-sage text-white rounded-xl py-2.5 font-bold text-sm disabled:opacity-40 hover:bg-sage/90 transition-all shadow-sm"
            >
              Tạo hũ ngay
            </button>
          </div>
        </div>
      </Card>

      {/* Danh sách các Hũ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {jars.map((j) => (
          <JarCard key={j.id} j={j} />
        ))}
      </div>
    </div>
  )
}