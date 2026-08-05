import type { Category, Expense } from '../types'

const today = new Date().toISOString()

export const DEMO_CATEGORIES: Category[] = [
  { id: 'demo-1', name: 'Food & Dining', icon: '🍕', createdAt: today },
  { id: 'demo-2', name: 'Transport',     icon: '🚗', createdAt: today },
  { id: 'demo-3', name: 'Shopping',      icon: '🛍️', createdAt: today },
  { id: 'demo-4', name: 'Entertainment', icon: '🎬', createdAt: today },
  { id: 'demo-5', name: 'Household',     icon: '🏠', createdAt: today },
  { id: 'demo-6', name: 'Health',        icon: '💊', createdAt: today },
]

export const DEMO_EXPENSES: Expense[] = [
  // Food & Dining
  {
    id: 'dexp-1', description: 'Lunch at cafe', amount: 450,
    categoryId: 'demo-1', date: today, createdAt: today,
    category: DEMO_CATEGORIES[0]
  },
  {
    id: 'dexp-2', description: 'Morning coffee', amount: 180,
    categoryId: 'demo-1', date: today, createdAt: today,
    category: DEMO_CATEGORIES[0]
  },
  {
    id: 'dexp-3', description: 'Dinner with family', amount: 1200,
    categoryId: 'demo-1', date: today, createdAt: today,
    category: DEMO_CATEGORIES[0]
  },
  {
    id: 'dexp-4', description: 'Grocery shopping', amount: 850,
    categoryId: 'demo-1', date: today, createdAt: today,
    category: DEMO_CATEGORIES[0]
  },
  {
    id: 'dexp-5', description: 'Pizza delivery', amount: 650,
    categoryId: 'demo-1', date: today, createdAt: today,
    category: DEMO_CATEGORIES[0]
  },
  // Transport
  {
    id: 'dexp-6', description: 'Uber to office', amount: 220,
    categoryId: 'demo-2', date: today, createdAt: today,
    category: DEMO_CATEGORIES[1]
  },
  {
    id: 'dexp-7', description: 'Metro card recharge', amount: 500,
    categoryId: 'demo-2', date: today, createdAt: today,
    category: DEMO_CATEGORIES[1]
  },
  {
    id: 'dexp-8', description: 'Petrol', amount: 800,
    categoryId: 'demo-2', date: today, createdAt: today,
    category: DEMO_CATEGORIES[1]
  },
  // Shopping
  {
    id: 'dexp-9', description: 'New headphones', amount: 2499,
    categoryId: 'demo-3', date: today, createdAt: today,
    category: DEMO_CATEGORIES[2]
  },
  {
    id: 'dexp-10', description: 'T-shirt', amount: 799,
    categoryId: 'demo-3', date: today, createdAt: today,
    category: DEMO_CATEGORIES[2]
  },
  // Entertainment
  {
    id: 'dexp-11', description: 'Netflix subscription', amount: 499,
    categoryId: 'demo-4', date: today, createdAt: today,
    category: DEMO_CATEGORIES[3]
  },
  {
    id: 'dexp-12', description: 'Movie tickets', amount: 480,
    categoryId: 'demo-4', date: today, createdAt: today,
    category: DEMO_CATEGORIES[3]
  },
  // Household
  {
    id: 'dexp-13', description: 'Electricity bill', amount: 1200,
    categoryId: 'demo-5', date: today, createdAt: today,
    category: DEMO_CATEGORIES[4]
  },
  {
    id: 'dexp-14', description: 'Internet bill', amount: 699,
    categoryId: 'demo-5', date: today, createdAt: today,
    category: DEMO_CATEGORIES[4]
  },
  // Health
  {
    id: 'dexp-15', description: 'Pharmacy', amount: 350,
    categoryId: 'demo-6', date: today, createdAt: today,
    category: DEMO_CATEGORIES[5]
  },
  {
    id: 'dexp-16', description: 'Gym membership', amount: 999,
    categoryId: 'demo-6', date: today, createdAt: today,
    category: DEMO_CATEGORIES[5]
  },
]