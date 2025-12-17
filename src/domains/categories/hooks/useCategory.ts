'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryWithChildren, CategoryFilters, CreateCategoryData, UpdateCategoryData } from '../types';
import { categoryService } from '../services/categoryService';

export function useCategories(filters?: CategoryFilters) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoryService.getCategories(filters);
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [filters]);

  return { categories, loading, error, refetch: () => setLoading(true) };
}

export function useCategoryTree() {
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await categoryService.getCategoryTree();
        setCategoryTree(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category tree');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTree();
  }, []);

  return { categoryTree, loading, error, refetch: () => setLoading(true) };
}

export function useCategory(id?: string, slug?: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id && !slug) {
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = id 
          ? await categoryService.getCategoryById(id)
          : await categoryService.getCategoryBySlug(slug!);
        setCategory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, slug]);

  return { category, loading, error };
}

export function useCategoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (data: CreateCategoryData): Promise<Category | null> => {
    try {
      setLoading(true);
      setError(null);
      const category = await categoryService.createCategory(data);
      return category;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, data: UpdateCategoryData): Promise<Category | null> => {
    try {
      setLoading(true);
      setError(null);
      const category = await categoryService.updateCategory(id, data);
      return category;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await categoryService.deleteCategory(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
}
