import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Expense } from '../../types'
import styles from './CategoryCard.module.scss'

interface Props {
  id: string
  name: string
  icon?: string | null
  total: number
  color: string
  expenses: Expense[]
  pendingIds: string[]
  onDelete: (id: string) => void
  onDeleteExpense: (id: string) => void
}

const LONG_PRESS_MS = 500

export const CategoryCard = ({
  id, name, icon, total, color,
  expenses, pendingIds, onDelete, onDeleteExpense
}: Props) => {
  const [isOpen, setIsOpen]         = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress  = useRef(false)
  const pointerMoved  = useRef(false)
  const startPos      = useRef({ x: 0, y: 0 })

  const expTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expDidLongPress = useRef(false)

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const fmt        = (n: number) => n.toLocaleString('en-IN')
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })

  // ── Category press handlers (pointer events — works for both touch and mouse) ──
  const onPressStart = (e: React.PointerEvent) => {
    didLongPress.current  = false
    pointerMoved.current  = false
    startPos.current      = { x: e.clientX, y: e.clientY }

    timerRef.current = setTimeout(() => {
      if (pointerMoved.current) return
      didLongPress.current = true
      if (navigator.vibrate) navigator.vibrate(60)
      setEditMode(true)
      setIsOpen(false)
    }, LONG_PRESS_MS)
  }

  const onPressMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - startPos.current.x)
    const dy = Math.abs(e.clientY - startPos.current.y)
    if (dx > 8 || dy > 8) {
      pointerMoved.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }

  const onPressEnd = (e: React.PointerEvent) => {
    e.preventDefault() // prevent ghost mouse events on mobile
    if (timerRef.current) clearTimeout(timerRef.current)
    if (pointerMoved.current) return
    if (didLongPress.current) return
    // Short tap
    if (editMode) {
      setEditMode(false)
    } else {
      setIsOpen(prev => !prev)
    }
  }

  const onPressCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    didLongPress.current = false
  }

  // ── Expense press handlers ─────────────────────────────
  const onExpPressStart = (expId: string) => {
    expDidLongPress.current = false
    expTimerRef.current = setTimeout(() => {
      expDidLongPress.current = true
      if (navigator.vibrate) navigator.vibrate(40)
      setDeletingExpenseId(expId)
    }, LONG_PRESS_MS)
  }

  const onExpPressEnd = (expId: string) => {
    if (expTimerRef.current) clearTimeout(expTimerRef.current)
    if (expDidLongPress.current) return
    if (deletingExpenseId === expId) setDeletingExpenseId(null)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${editMode ? styles.editMode : ''} ${isDragging ? styles.dragging : ''}`}
    >
      {/* Category header */}
      <div
        className={styles.header}
        onPointerDown={onPressStart}
        onPointerMove={onPressMove}
        onPointerUp={onPressEnd}
        onPointerCancel={onPressCancel}
        onPointerLeave={onPressCancel}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div
          className={styles.accentBar}
          style={{ background: editMode ? 'var(--danger)' : color }}
        />

        <div className={styles.iconWrap}>
          <span>{icon ?? '📦'}</span>
        </div>

        <div className={styles.nameWrap}>
          <span className={styles.name}>{name}</span>
          {editMode && <span className={styles.editHint}>Tap to cancel</span>}
        </div>

        <span
          className={`${styles.amount} ${
            expenses.some(e => pendingIds.includes(e.id)) ? styles.pendingAmount : ''
          }`}
          style={{ color: editMode ? 'var(--danger)' : color }}
        >
          {expenses.some(e => pendingIds.includes(e.id)) ? '...' : `₹${fmt(total)}`}
        </span>

        {!editMode && (
          <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} ${styles.chevron}`}/>
        )}

        {editMode && (
          <>
            <div
              className={styles.dragHandle}
              {...attributes}
              {...listeners}
              aria-label="Drag to reorder"
              onPointerDown={e => e.stopPropagation()}
            >
              <i className="ti ti-grip-vertical"/>
            </div>
            <button
              className={styles.deleteIconBtn}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(id) }}
              aria-label="Delete category"
            >
              <i className="ti ti-trash"/>
            </button>
          </>
        )}
      </div>

      {/* Expense list */}
      {isOpen && !editMode && (
        <div className={styles.expenseList}>
          {expenses.length === 0 ? (
            <div className={styles.noExpenses}>No expenses in this period</div>
          ) : (
            expenses.map(exp => (
              <div
                key={exp.id}
                className={`${styles.expenseRow} ${deletingExpenseId === exp.id ? styles.expDeleting : ''}`}
                onPointerDown={() => onExpPressStart(exp.id)}
                onPointerUp={() => onExpPressEnd(exp.id)}
                onPointerCancel={() => { if (expTimerRef.current) clearTimeout(expTimerRef.current) }}
              >
                <span className={styles.expName}>{exp.description}</span>
                <span className={styles.expDate}>{formatDate(exp.date)}</span>

                {pendingIds.includes(exp.id) ? (
                  <span className={styles.pendingAmt}>saving...</span>
                ) : (
                  <span className={styles.expAmt}>₹{fmt(exp.amount)}</span>
                )}

                {deletingExpenseId === exp.id && (
                  <button
                    className={styles.expDeleteBtn}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteExpense(exp.id)
                      setDeletingExpenseId(null)
                    }}
                    aria-label="Delete expense"
                  >
                    <i className="ti ti-trash"/>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
