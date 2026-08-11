import axios from 'axios'
import type { AIResult, Category } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL

export const catagoriseExpense = async (message: string, categories: Category[]): Promise<AIResult[]> => {
    const response = await axios.post(`${BASE_URL}/ai`, { message, categories })
    const data = response.data
    // Handle both array and single object (backward compat)
    return Array.isArray(data) ? data : [data]
}