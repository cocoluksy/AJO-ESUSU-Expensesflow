import React, { createContext, useState, useContext, useCallback } from 'react';
import { expenseAPI, categoryAPI } from '../services/api';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all expenses
  const fetchExpenses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.getAll(params);
      setExpenses(response.data.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch expenses';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single expense
  const fetchExpenseById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.getById(id);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch expense';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create expense
  const createExpense = useCallback(async (expenseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.create(expenseData);
      setExpenses([response.data.data, ...expenses]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create expense';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [expenses]);

  // Update expense
  const updateExpense = useCallback(async (id, expenseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.update(id, expenseData);
      setExpenses(expenses.map(e => e.id === id ? response.data.data : e));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update expense';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [expenses]);

  // Delete expense
  const deleteExpense = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.delete(id);
      setExpenses(expenses.filter(e => e.id !== id));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete expense';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [expenses]);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch categories';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create category
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryAPI.create(categoryData);
      setCategories([...categories, response.data.data]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create category';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [categories]);

  // Update category
  const updateCategory = useCallback(async (id, categoryData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryAPI.update(id, categoryData);
      setCategories(categories.map(c => c.id === id ? response.data.data : c));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update category';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [categories]);

  // Delete category
  const deleteCategory = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryAPI.delete(id);
      setCategories(categories.filter(c => c.id !== id));
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete category';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const value = {
    expenses,
    categories,
    loading,
    error,
    fetchExpenses,
    fetchExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
