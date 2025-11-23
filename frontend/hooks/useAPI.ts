

import { useState, useCallback } from 'react';
import api from '@/lib/api';


export function useAPI<T = any>(
  apiFunction: () => Promise<{ success: boolean; data?: T; message?: string }>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'حدث خطأ غير متوقع');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  
  const refresh = useCallback(() => {
    execute();
  }, [execute]);

  return { data, loading, error, execute, refresh };
}


export function useAPIWithParams<T = any, P = any>(
  apiFunction: (params: P) => Promise<{ success: boolean; data?: T; message?: string }>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const execute = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction(params);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'حدث خطأ غير متوقع');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
}


export function useListAPI<T = any>(
  apiFunction: (params?: any) => Promise<{ success: boolean; data?: T[]; count?: number }>
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  
  const load = useCallback(async (params?: any, append: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction(params);
      if (response.success && response.data) {
        if (append) {
          setItems(prev => [...prev, ...response.data!]);
        } else {
          setItems(response.data);
        }
      } else {
        setError('فشل تحميل البيانات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
      if (!append) {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  
  const refresh = useCallback(async (params?: any) => {
    setRefreshing(true);
    try {
      await load(params, false);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  
  const loadMore = useCallback(async (params?: any) => {
    await load(params, true);
  }, [load]);

  return { items, loading, error, refreshing, load, refresh, loadMore };
}




export function useStudent() {
  return useAPI(() => api.students.getMe());
}


export function useBooks() {
  return useListAPI((params) => api.books.getAll(params));
}


export function useLectures() {
  return useListAPI((params) => api.lectures.getAll(params));
}


export function useAttendance() {
  return useListAPI((params) => api.attendance.getAll(params));
}


export function usePayments() {
  return useListAPI((params) => api.payments.getAll(params));
}


export function useNews() {
  return useListAPI((params) => api.news.getAll(params));
}


export function useBorrowings() {
  return useListAPI((params) => api.borrowings.getAll(params));
}

