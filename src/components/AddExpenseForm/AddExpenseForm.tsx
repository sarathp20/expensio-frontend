import { useRef, useState } from 'react'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import type { AIResult, Category, CategorySuggestion } from '../../types'
import styles from './AddExpenseForm.module.scss'
import { FormLoading } from '../FormLoading/FormLoading'
import { createCategory } from '../../api/categories'
import { addCategory } from '../../store/categorySlice'
import { Modal } from '../Modal/Modal'
import { AddCategoryForm } from '../AddCategoryForm/AddCategoryForm'

interface Props {
    onClose: () => void
    onDelete: () => void
    onSave: (
        description: string,
        amount: number,
        categoryId: string,
        date: string,
        category: Category
    ) => Promise<void>
    categories: Category[]
    isLoading: boolean
    aiResults: AIResult | null | undefined
}

const todayISO = () => new Date().toISOString().split('T')[0]

export const AddExpenseForm = ({ onClose, onDelete, onSave, categories, isLoading, aiResults }: Props) => {
    const [description, setDescription] = useState(aiResults?.item ?? '')
    const [amount, setAmount] = useState(aiResults?.amount ?? 0)
    const [categoryId, setCategoryId] = useState(
        aiResults?.isCategoryFound && aiResults?.category ? aiResults.category.id : ''
    )
    const [date, setDate] = useState(todayISO())
    const [categoryLoading, setCategoryLoading] = useState(false)
    const [showCategoryForm, setShowCategoryForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const savingRef = useRef(false)
    const creatingCategoryRef = useRef(false)
    const dispatch = useAppDispatch()



    const handleFormSave = async () => {
        if (!description || !categoryId) return
        if (savingRef.current) return
        savingRef.current = true
        setSaving(true)
        try {
            const category = categories.find(c => c.id === categoryId)!
            await onSave(description, amount, categoryId, date, category)
            onClose()
        } catch (e) {
            console.log('Error saving expense', e)
            savingRef.current = false
        } finally {
            setSaving(false)
        }
    }

    const handleOnSuggestionChipClick = async ({ name, icon }: CategorySuggestion) => {
        if (creatingCategoryRef.current) return
        creatingCategoryRef.current = true
        try {
            setCategoryLoading(true)
            const response = await createCategory(name, icon)
            dispatch(addCategory(response))
            setCategoryId(response.id)
        } catch (e) {
            console.log('Error creating category', e)
        } finally {
            setCategoryLoading(false)
            creatingCategoryRef.current = false
        }
    }

    const handleOnCreateCategoryForm = (newCategoryId: string) => {
        setCategoryId(newCategoryId)
        setShowCategoryForm(false)
    }

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <FormLoading /><FormLoading /><FormLoading />
            </div>
        )
    }

    return (
        <div>
            <form className={styles.form} onSubmit={e => { e.preventDefault(); handleFormSave() }}>
                <div className={styles.formHeader}>
                    <p className={styles.title}>Add Expense</p>
                    <button type="button" className={styles.deleteBtn} onClick={onDelete}>
                        <i className="ti ti-trash" />
                    </button>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Description</span>
                    <input
                        className={styles.input}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="e.g. Tomato"
                        required
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <span className={styles.label}>Amount</span>
                        <input
                            className={styles.input}
                            type="number"
                            value={amount || ''}
                            onChange={e => setAmount(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>
                    <div className={styles.field}>
                        <span className={styles.label}>Date</span>
                        <input
                            className={styles.input}
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Category</span>
                    {categoryLoading ? <FormLoading /> : (
                        <div className={styles.categoryRow}>
                            <select
                                className={styles.select}
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className={styles.addCategoryBtn}
                                onClick={() => setShowCategoryForm(true)}
                            >
                                <i className="ti ti-plus" />
                            </button>
                        </div>
                    )}
                </div>

                {aiResults?.suggestions && aiResults.suggestions.length > 0 && (
                    <div className={styles.field}>
                        <span className={styles.suggestionsLabel}>Suggestions</span>
                        <div className={styles.suggestions}>
                            {aiResults.suggestions.slice(0, 5).map(sug => (
                                <button
                                    key={sug.name}
                                    type="button"
                                    className={styles.chip}
                                    disabled={categoryLoading}
                                    onClick={() => handleOnSuggestionChipClick(sug)}
                                >
                                    {sug.icon} {sug.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={!description || !categoryId || saving}
                >
                    {saving ? 'Saving...' : 'Save Expense'}
                </button>
            </form>

            {showCategoryForm && (
                <Modal onClose={() => setShowCategoryForm(false)}>
                    <AddCategoryForm
                        onCreate={handleOnCreateCategoryForm}
                        onClose={() => setShowCategoryForm(false)}
                    />
                </Modal>
            )}
        </div>
    )
}
