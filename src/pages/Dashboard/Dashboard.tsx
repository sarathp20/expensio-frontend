import { useEffect, useMemo, useRef, useState } from 'react'
import {
    DndContext, closestCenter,
    PointerSensor, TouchSensor,
    useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { deleteExpense as deleteExpenseApi } from '../../api/expenses'
import { deleteExpense } from '../../store/expenseSlice'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { deleteCategory as deleteCategoryApi, getCategories } from '../../api/categories'
import { deleteCategory, setCategories, setCategoriesError, setCategoriesLoading } from '../../store/categorySlice'
import { getExpenses } from '../../api/expenses'
import { setExpenseLoading, setExpenses, addPendingExpense, confirmExpense, rejectExpense } from '../../store/expenseSlice'
import { catagoriseExpense } from '../../api/ai'
import { createExpense } from '../../api/expenses'
import { Modal } from '../../components/Modal/Modal'
import { AddExpenseForm } from '../../components/AddExpenseForm/AddExpenseForm'
import { CategoryCard } from '../../components/CategoryCard/CategoryCard'
import { QueueCard } from '../../components/QueueCard/QueueCard'
import { PinModal } from '../../components/PinModal/PinModal'
import { openPinModal, logout } from '../../store/authSlice'
import { DEMO_CATEGORIES, DEMO_EXPENSES } from '../../data/demoData'
import type { Category, Expense, QueueItem } from '../../types'
import styles from './Dashboard.module.scss'

const COLORS = [
    '#1D9E75', '#7F77DD', '#D85A30',
    '#378ADD', '#639922', '#BA7517',
    '#C4528A', '#4A9E8E',
]

type Filter = 'today' | 'week' | 'month' | 'all'

function filterByDate(expenses: Expense[], filter: Filter): Expense[] {
    const now = new Date()
    return expenses.filter(e => {
        const d = new Date(e.date)
        if (filter === 'today') return d.toDateString() === now.toDateString()
        if (filter === 'week') {
            const ago = new Date(now); ago.setDate(now.getDate() - 7); return d >= ago
        }
        if (filter === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }
        return true
    })
}

const R = 72
const CIRCUMFERENCE = 2 * Math.PI * R
const GAP = 4

function buildSegments(cats: { name: string; total: number; color: string }[], grandTotal: number) {
    if (grandTotal === 0) return []
    const active = cats.filter(c => c.total > 0)
    const available = CIRCUMFERENCE - active.length * GAP
    let cumulative = 0
    return active.map(cat => {
        const arcLength = (cat.total / grandTotal) * available
        const rotation = (cumulative / CIRCUMFERENCE) * 360
        cumulative += arcLength + GAP
        return { name: cat.name, color: cat.color, arcLength, rotation }
    })
}

export default function Dashboard() {
    const dispatch = useAppDispatch()
    const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
    const showPinModal = useAppSelector(s => s.auth.showPinModal)

    // Real data from Redux
    const { list: realCategories, loading: catLoading, error: catError } = useAppSelector(s => s.categories)
    const { list: realExpenses, pendingIds } = useAppSelector(s => s.expenses)

    // Demo state — in-memory only
    const [demoCategories, setDemoCategories] = useState(DEMO_CATEGORIES)
    const [demoExpenses, setDemoExpenses] = useState(DEMO_EXPENSES)

    // Use demo or real data based on auth
    const categoriesList = isAuthenticated ? realCategories : demoCategories
    const expensesList = isAuthenticated ? realExpenses : demoExpenses

    const [filter, setFilter] = useState<Filter>('month')
    const [queue, setQueue] = useState<QueueItem[]>([])
    const [activeItem, setActiveItem] = useState<QueueItem | null>(null)
    const [manualOrder, setManualOrder] = useState<string[]>([])
    const [smartInput, setSmartInput] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } })
    )

    // Load real data only when authenticated
    useEffect(() => {
        if (!isAuthenticated) return
        const load = async () => {
            dispatch(setCategoriesLoading(true))
            const cats = await getCategories()
            dispatch(setCategories(cats))
            dispatch(setCategoriesLoading(false))
        }
        load()
    }, [isAuthenticated])

    useEffect(() => {
        if (!isAuthenticated) return
        const load = async () => {
            dispatch(setExpenseLoading(true))
            const exps = await getExpenses()
            dispatch(setExpenses(exps))
            dispatch(setExpenseLoading(false))
        }
        load()
    }, [isAuthenticated])

    // Sync category order
    const categoryOrder = useMemo(() => {
        if (manualOrder.length === 0) return categoriesList.map(c => c.id)
        const prevSet = new Set(manualOrder)
        const newIds = categoriesList.map(c => c.id).filter(id => !prevSet.has(id))
        return newIds.length === 0 ? manualOrder : [...manualOrder, ...newIds]
    }, [manualOrder, categoriesList])

    // Derived data
    const filtered = filterByDate(expensesList, filter)

    const categoriesWithExpenses = categoriesList.map((cat, i) => ({
        ...cat,
        color: COLORS[i % COLORS.length],
        expenses: filtered.filter(e => e.categoryId === cat.id),
        total: filtered.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0),
    }))

    const sortedCategories = categoryOrder
        .map(id => categoriesWithExpenses.find(c => c.id === id))
        .filter(Boolean) as typeof categoriesWithExpenses

    const grandTotal = sortedCategories.reduce((s, c) => s + c.total, 0)
    const fmt = (n: number) => n.toLocaleString('en-IN')

    const segments = buildSegments(
        sortedCategories.map(c => ({ name: c.name, total: c.total, color: c.color })),
        grandTotal
    )

    const periodLabel = () => {
        const now = new Date()
        if (filter === 'today') return now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        if (filter === 'week') return 'Last 7 days'
        if (filter === 'month') return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        return 'All time'
    }

    // DnD
    // handleDragEnd — change setCategoryOrder to setManualOrder
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setManualOrder(prev => {
                const oldIndex = prev.indexOf(String(active.id))
                const newIndex = prev.indexOf(String(over.id))
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }


    const handleDeleteCategory = async (id: string) => {
        if (!isAuthenticated) {
            setDemoCategories(prev => prev.filter(c => c.id !== id))
            setDemoExpenses(prev => prev.filter(e => e.categoryId !== id))
            setManualOrder(prev => prev.filter(cid => cid !== id))
            return
        }
        try {
            dispatch(setCategoriesLoading(true))
            await deleteCategoryApi(id)
            dispatch(deleteCategory(id))
            setManualOrder(prev => prev.filter(cid => cid !== id))
        } catch {
            dispatch(setCategoriesError('Error deleting category'))
        } finally {
            dispatch(setCategoriesLoading(false))
        }
    }

    // Delete expense
    const handleDeleteExpense = async (id: string) => {
        if (!isAuthenticated) {
            setDemoExpenses(prev => prev.filter(e => e.id !== id))
            return
        }
        try {
            await deleteExpenseApi(id)
            dispatch(deleteExpense(id))
        } catch (e) {
            console.log('Error deleting expense', e)
        }
    }

    // Optimistic save
    const handleOptimisticSave = async (
        description: string, amount: number,
        categoryId: string, date: string, category: Category
    ) => {
        if (!isAuthenticated) {
            // Demo mode — add to local state only
            const tempExpense: Expense = {
                id: `demo-temp-${Date.now()}`,
                description, amount, categoryId,
                date: date || new Date().toISOString(),
                createdAt: new Date().toISOString(),
                category,
            }
            setDemoExpenses(prev => [tempExpense, ...prev])
            return
        }
        // Real mode — optimistic update
        const tempId = `temp_${crypto.randomUUID()}`
        dispatch(addPendingExpense({
            id: tempId, description, amount, categoryId,
            date: date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            category,
        }))
        try {
            const response = await createExpense(description, amount, categoryId, date)
            dispatch(confirmExpense({ tempId, expense: response }))
        } catch {
            dispatch(rejectExpense(tempId))
        }
    }

    // Smart input
    const handleSmartSubmit = async () => {
        if (!smartInput.trim()) return

        // Single queue item for the whole input while AI processes
        const tempItem: QueueItem = {
            id: crypto.randomUUID(),
            rawInput: smartInput.trim(),
            status: 'loading',
            aiResult: null,
        }

        setQueue(prev => [...prev, tempItem])
        setSmartInput('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        try {
            const results = await catagoriseExpense(tempItem.rawInput, categoriesList)

            // Remove the temp loading card
            setQueue(prev => prev.filter(i => i.id !== tempItem.id))

            // Add one card per identified expense
            const newItems: QueueItem[] = results.map(result => ({
                id: crypto.randomUUID(),
                rawInput: result.item,
                status: 'ready' as const,
                aiResult: result,
            }))

            setQueue(prev => [...prev, ...newItems])
        } catch {
            setQueue(prev => prev.map(i =>
                i.id === tempItem.id
                    ? { ...i, status: 'error' }
                    : i
            ))
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSmartInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
    }

    // Queue handlers
    const handleQueueTap = (item: QueueItem) => setActiveItem(item)
    const handleQueueDelete = (id: string) => {
        setQueue(prev => prev.filter(i => i.id !== id))
        if (activeItem?.id === id) setActiveItem(null)
    }
    const handleDismiss = () => setActiveItem(null)
    const handleDelete = () => {
        if (activeItem) { setQueue(prev => prev.filter(i => i.id !== activeItem.id)); setActiveItem(null) }
    }
    const handleSave = () => {
        if (activeItem) { setQueue(prev => prev.filter(i => i.id !== activeItem.id)); setActiveItem(null) }
    }
    const handleQuickSave = async (item: QueueItem) => {
        if (!item.aiResult?.category) return
        setQueue(prev => prev.filter(i => i.id !== item.id))
        await handleOptimisticSave(
            item.aiResult.item, item.aiResult.amount,
            item.aiResult.category.id,
            new Date().toISOString(),
            item.aiResult.category
        )
    }
    const handleManualAdd = () => {
        setActiveItem({ id: crypto.randomUUID(), rawInput: '', status: 'ready', aiResult: null })
    }

    const TABS: { key: Filter; label: string }[] = [
        { key: 'month', label: 'Month' },
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'Week' },
        { key: 'all', label: 'All' },
    ]

    return (
        <div className={styles.dashboard}>

            {/* Top bar */}
            <div className={styles.topbar}>
                <span className={styles.logo}>Expensio</span>
                <div className={styles.topbarRight}>
                    {/* Lock / unlock icon */}
                    <button
                        className={styles.lockBtn}
                        onClick={() => isAuthenticated ? dispatch(logout()) : dispatch(openPinModal())}
                    >
                        {isAuthenticated ? '🔓' : '🔒'}
                    </button>
                    <button className={styles.addBtn} onClick={handleManualAdd}>+ Add</button>
                </div>
            </div>

            {/* Demo banner */}
            {!isAuthenticated && (
                <div className={styles.demoBanner} onClick={() => dispatch(openPinModal())}>
                    <span>👀 Demo mode — tap to unlock your data</span>
                </div>
            )}

            {/* PIN Modal */}
            {showPinModal && <PinModal />}

            {/* Donut hero */}
            <div className={styles.hero}>
                <div className={styles.donutWrap}>
                    <svg className={`${styles.donutSvg} ${isAuthenticated && pendingIds.length > 0 ? styles.spinning : ''}`} viewBox="0 0 180 180" aria-hidden="true">
                        <circle cx="90" cy="90" r={R} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
                        {segments.map(seg => (
                            <circle
                                key={seg.name} cx="90" cy="90" r={R}
                                stroke={seg.color} strokeWidth="14" fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${seg.arcLength} ${CIRCUMFERENCE}`}
                                strokeDashoffset={0}
                                transform={`rotate(${seg.rotation - 90}, 90, 90)`}
                            />
                        ))}
                    </svg>
                    <div className={styles.donutCenter}>
                        <span className={styles.donutLabel}>Spent</span>
                        <span className={styles.donutAmount}>₹{fmt(grandTotal)}</span>
                        <span className={styles.donutSub}>{periodLabel()}</span>
                    </div>
                </div>

                {sortedCategories.filter(c => c.total > 0).length > 0 && (
                    <div className={styles.legend}>
                        {sortedCategories.filter(c => c.total > 0).map(cat => (
                            <div key={cat.id} className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: cat.color }} />
                                <span className={styles.legendName}>{cat.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter tabs */}
            <div className={styles.filters}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`${styles.filterTab} ${filter === t.key ? styles.active : ''}`}
                        onClick={() => setFilter(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Category list */}
            <div className={styles.list}>
                {catLoading && <div className={styles.empty}>Loading...</div>}
                {catError && <div className={styles.empty}>{catError}</div>}
                {!catLoading && categoriesList.length === 0 && (
                    <div className={styles.empty}>
                        No categories yet.<br />Type an expense below to get started.
                    </div>
                )}
                {!catLoading && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
                            {sortedCategories.map(cat => (
                                <CategoryCard
                                    key={cat.id}
                                    id={cat.id}
                                    name={cat.name}
                                    icon={cat.icon}
                                    total={cat.total}
                                    color={cat.color}
                                    expenses={cat.expenses}
                                    onDelete={handleDeleteCategory}
                                    onDeleteExpense={handleDeleteExpense}
                                    pendingIds={isAuthenticated ? pendingIds : []}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Queue */}
            {queue.length > 0 && (
                <div className={styles.queueSection}>
                    {queue.map(item => (
                        <QueueCard
                            key={item.id} item={item}
                            onTap={handleQueueTap}
                            onDelete={handleQueueDelete}
                            onQuickSave={handleQuickSave}
                        />
                    ))}
                </div>
            )}

            {/* Active form */}
            {activeItem && (
                <Modal onClose={handleDismiss}>
                    <AddExpenseForm
                        key={activeItem?.id}
                        onClose={handleSave}
                        onDelete={handleDelete}
                        isLoading={activeItem.status === 'loading'}
                        aiResults={activeItem.aiResult}
                        categories={categoriesList}
                        onSave={handleOptimisticSave}
                    />
                </Modal>
            )}

            {/* Bottom input */}
            <div className={styles.bottomBar}>
                <div className={styles.inputRow}>
                    <textarea
                        ref={textareaRef}
                        className={styles.inputField}
                        placeholder={isAuthenticated ? 'What did you spend on?' : 'Try the AI — type an expense...'}
                        value={smartInput}
                        onChange={handleInput}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSmartSubmit() }
                        }}
                        rows={1}
                    />
                    <button className={styles.aiBtn} onClick={handleSmartSubmit} disabled={!smartInput.trim()}>
                        <i className="ti ti-sparkles" />
                        <span>Add</span>
                    </button>
                </div>
                <div className={styles.inputHint}>Long press to delete · Drag ≡ to reorder</div>
            </div>
        </div>
    )
}
