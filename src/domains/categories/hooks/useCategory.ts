'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryWithChildren, CategoryFilters, CreateCategoryData, UpdateCategoryData } from '../types';

export function useCategories(filters?: CategoryFilters) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        const res = await fetch(`/api/categories?${params.toString()}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch categories');
        if (!cancelled) setCategories(json.categories);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, [filters?.search]);

  return { categories, loading, error, refetch: () => setLoading(true) };
}

export function useCategoryTree() {
  const [categoryTree, setCategoryTree] = useState<CategoryWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCategoryTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch category tree');
        if (!cancelled) setCategoryTree(json.categories as CategoryWithChildren[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch category tree');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategoryTree();
    return () => { cancelled = true; };
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
    let cancelled = false;
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const endpoint = id
          ? `/api/categories/${id}`
          : `/api/categories/${slug}?slug=true`;
        const res = await fetch(endpoint);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch category');
        if (!cancelled) setCategory(json.category);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch category');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategory();
    return () => { cancelled = true; };
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
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create category');
      return json.category;
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
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update category');
      return json.category;
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
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete category');
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
