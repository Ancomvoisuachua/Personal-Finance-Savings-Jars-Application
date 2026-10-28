// api.js
const STORAGE_KEY = 'fintrack_local_db_v1'

const todayStr = () => new Date().toISOString().slice(0, 10)
const currentMonthStr = () => new Date().toISOString().slice(0, 7) // "YYYY-MM"

const defaultDb = {
  categories: [
    { id: 1, name: 'Ăn uống', type: 'expense', icon: '🍜' },
    { id: 2, name: 'Đi lại', type: 'expense', icon: '🛵' },
    { id: 3, name: 'Mua sắm', type: 'expense', icon: '🛍️' },
    { id: 4, name: 'Giải trí', type: 'expense', icon: '🎮' },
    { id: 5, name: 'Lương', type: 'income', icon: '💼' },
    { id: 6, name: 'Thưởng / Thêm', type: 'income', icon: '🎁' }
  ],
  budgets: [
    { id: 1, category_id: 1, limit_amount: 150000, period_type: 'daily' },
    { id: 2, category_id: 2, limit_amount: 50000, period_type: 'daily' },
    { id: 3, category_id: 3, limit_amount: 2000000, period_type: 'monthly' },
    { id: 4, category_id: 4, limit_amount: 500000, period_type: 'monthly' }
  ],
  transactions: [
    { id: 1, category_id: 1, amount: 45000, type: 'expense', note: 'Phở bò sáng', date: todayStr() },
    { id: 2, category_id: 1, amount: 35000, type: 'expense', note: 'Cơm tấm trưa', date: todayStr() },
    { id: 3, category_id: 2, amount: 30000, type: 'expense', note: 'Đổ xăng', date: todayStr() },
    { id: 4, category_id: 5, amount: 12000000, type: 'income', note: 'Lương tháng này', date: todayStr() }
  ],
  jars: [
    { id: 1, name: 'Du lịch Đà Lạt', target_amount: 10000000, current_amount: 2500000, allocation_percentage: 10, deadline: '2027-03-01' },
    { id: 2, name: 'Quỹ khẩn cấp', target_amount: 15000000, current_amount: 5000000, allocation_percentage: 15, deadline: '2026-12-31' }
  ],
  nid: 100
}

// Lấy dữ liệu từ LocalStorage
const loadDb = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : defaultDb
  } catch (e) {
    return defaultDb
  }
}

// Lưu dữ liệu vào LocalStorage
const saveDb = (db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (e) {
    console.error('Không thể lưu vào localStorage', e)
  }
}

const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 80))

export const getCategories = () => {
  const db = loadDb()
  return wait(db.categories)
}

export const getTransactions = () => {
  const db = loadDb()
  return wait([...db.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id))
}

export const addTransaction = (t) => {
  const db = loadDb()
  const tx = { ...t, id: db.nid++ }
  db.transactions.push(tx)

  // Phân bổ tự động vào hũ nếu là thu nhập
  if (t.type === 'income') {
    db.jars.forEach((j) => {
      if (j.allocation_percentage > 0) {
        j.current_amount += Math.round((t.amount * j.allocation_percentage) / 100)
      }
    })
  }

  saveDb(db)
  return wait(tx)
}

export const deleteTransaction = (id) => {
  const db = loadDb()
  db.transactions = db.transactions.filter((t) => t.id !== id)
  saveDb(db)
  return wait(true)
}

export const getDashboard = () => {
  const db = loadDb()
  const today = todayStr()
  const currentMonth = currentMonthStr()

  // 1. Tính toán ngân sách
  const budgetItems = db.budgets.map((b) => {
    const isDaily = b.period_type === 'daily'
    const categorySpent = db.transactions
      .filter((t) => {
        if (t.type !== 'expense' || t.category_id !== b.category_id) return false
        return isDaily ? t.date === today : t.date.startsWith(currentMonth)
      })
      .reduce((s, t) => s + t.amount, 0)

    const percent_used = Math.round((categorySpent / b.limit_amount) * 100)
    return {
      ...b,
      category: db.categories.find((c) => c.id === b.category_id),
      spent: categorySpent,
      percent_used,
      is_exceeded: categorySpent > b.limit_amount,
      warning_level: categorySpent > b.limit_amount ? 'exceeded' : percent_used >= 80 ? 'warning' : 'ok'
    }
  })

  // 2. Thống kê tổng quan thu / chi tháng này
  const monthTransactions = db.transactions.filter((t) => t.date.startsWith(currentMonth))
  const totalIncome = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // 3. Phân tích chi tiêu theo danh mục (cho Chart)
  const categorySpendingMap = {}
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpendingMap[t.category_id] = (categorySpendingMap[t.category_id] || 0) + t.amount
    })

  const spendingByCategory = Object.entries(categorySpendingMap).map(([catId, amount]) => {
    const cat = db.categories.find((c) => c.id === Number(catId))
    return {
      name: cat ? cat.name : 'Khác',
      icon: cat ? cat.icon : '💸',
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }
  }).sort((a, b) => b.amount - a.amount)

  return wait({
    budgets: budgetItems,
    jars: db.jars,
    summary: { totalIncome, totalExpense, netSavings: totalIncome - totalExpense },
    spendingByCategory
  })
}

export const addBudget = (b) => {
  const db = loadDb()
  const existingIndex = db.budgets.findIndex(x => x.category_id === b.category_id && x.period_type === b.period_type)
  if (existingIndex >= 0) {
    db.budgets[existingIndex].limit_amount = b.limit_amount
  } else {
    db.budgets.push({ ...b, id: db.nid++ })
  }
  saveDb(db)
  return wait(true)
}

export const getJars = () => {
  const db = loadDb()
  return wait(db.jars)
}

export const createJar = (j) => {
  const db = loadDb()
  db.jars.push({ ...j, id: db.nid++, current_amount: 0 })
  saveDb(db)
  return wait(true)
}

export const moveJar = ({ id, amount }) => {
  const db = loadDb()
  const j = db.jars.find((x) => x.id === id)
  if (!j) return Promise.reject(new Error('Hũ không tồn tại'))
  if (j.current_amount + amount < 0) return Promise.reject(new Error('Số dư hũ không đủ để rút'))
  j.current_amount += amount
  saveDb(db)
  return wait(j)
}