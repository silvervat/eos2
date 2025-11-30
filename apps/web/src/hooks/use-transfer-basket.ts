'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface TransferBasketItem {
  assetId: string;
  assetName: string;
  qrCode: string;
  currentWarehouse: string | null;
  currentStock: number;
  requestedQuantity: number;
  availableQuantity: number;
  thumbnailUrl: string | null;
  isValid: boolean;
  warnings: string[];
}

export interface TransferBasket {
  id: string;
  tenant_id: string;
  from_warehouse_id: string | null;
  to_project_id: string | null;
  to_warehouse_id: string | null;
  to_user_id: string | null;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  items: TransferBasketItem[];
  total_items: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Joined data
  from_warehouse?: { id: string; name: string; code: string } | null;
  to_project?: { id: string; name: string; code: string } | null;
  to_warehouse?: { id: string; name: string; code: string } | null;
  to_user?: { id: string; full_name: string } | null;
}

interface CreateBasketParams {
  from_warehouse_id?: string;
  to_project_id?: string;
  to_warehouse_id?: string;
  to_user_id?: string;
  notes?: string;
}

interface AddItemResult {
  basket: TransferBasket;
  item: TransferBasketItem;
  action: 'added' | 'incremented';
}

export function useTransferBasket(basketId?: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch existing basket
  const { data: basket, isLoading, refetch } = useQuery({
    queryKey: ['transfer-basket', basketId],
    queryFn: async () => {
      if (!basketId) return null;
      const res = await fetch(`/api/warehouse/transfer-basket/${basketId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch basket');
      }
      const { data } = await res.json();
      return data as TransferBasket;
    },
    enabled: !!basketId,
  });

  // Create new basket
  const createBasketMutation = useMutation({
    mutationFn: async (params: CreateBasketParams) => {
      const res = await fetch('/api/warehouse/transfer-basket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create basket');
      }
      const { data } = await res.json();
      return data as TransferBasket;
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Add item to basket by QR code
  const addItemMutation = useMutation({
    mutationFn: async ({ basketId, qrCode, quantity = 1 }: { basketId: string; qrCode: string; quantity?: number }) => {
      const res = await fetch(`/api/warehouse/transfer-basket/${basketId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Item not found');
      }
      const { data } = await res.json();
      return data as AddItemResult;
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['transfer-basket', data.basket.id], data.basket);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Update item quantity
  const updateItemMutation = useMutation({
    mutationFn: async ({ basketId, assetId, quantity }: { basketId: string; assetId: string; quantity: number }) => {
      const res = await fetch(`/api/warehouse/transfer-basket/${basketId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, quantity }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update item');
      }
      const { data } = await res.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['transfer-basket', data.basket.id], data.basket);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Remove item from basket
  const removeItemMutation = useMutation({
    mutationFn: async ({ basketId, assetId }: { basketId: string; assetId: string }) => {
      const res = await fetch(`/api/warehouse/transfer-basket/${basketId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove item');
      }
      const { data } = await res.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['transfer-basket', data.basket.id], data.basket);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Complete transfer
  const completeMutation = useMutation({
    mutationFn: async ({ basketId, notes }: { basketId: string; notes?: string }) => {
      const res = await fetch(`/api/warehouse/transfer-basket/${basketId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to complete transfer');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-basket'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-assets'] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Helper functions
  const createBasket = useCallback(async (params: CreateBasketParams) => {
    setError(null);
    return createBasketMutation.mutateAsync(params);
  }, [createBasketMutation]);

  const addItem = useCallback(async (qrCode: string, quantity = 1) => {
    if (!basketId) {
      setError('No basket selected');
      return null;
    }
    setError(null);
    return addItemMutation.mutateAsync({ basketId, qrCode, quantity });
  }, [basketId, addItemMutation]);

  const updateQuantity = useCallback(async (assetId: string, quantity: number) => {
    if (!basketId) {
      setError('No basket selected');
      return;
    }
    if (quantity < 1) {
      // Remove item if quantity is 0 or less
      return removeItemMutation.mutateAsync({ basketId, assetId });
    }
    setError(null);
    return updateItemMutation.mutateAsync({ basketId, assetId, quantity });
  }, [basketId, updateItemMutation, removeItemMutation]);

  const removeItem = useCallback(async (assetId: string) => {
    if (!basketId) {
      setError('No basket selected');
      return;
    }
    setError(null);
    return removeItemMutation.mutateAsync({ basketId, assetId });
  }, [basketId, removeItemMutation]);

  const completeTransfer = useCallback(async (notes?: string) => {
    if (!basketId) {
      setError('No basket selected');
      return;
    }
    setError(null);
    return completeMutation.mutateAsync({ basketId, notes });
  }, [basketId, completeMutation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const items = basket?.items || [];
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.requestedQuantity, 0);
  const hasInvalidItems = items.some(item => !item.isValid);
  const canComplete = totalItems > 0 && !hasInvalidItems && basket?.status === 'draft';

  return {
    // State
    basket,
    items,
    isLoading,
    error,

    // Computed
    totalItems,
    totalQuantity,
    hasInvalidItems,
    canComplete,

    // Actions
    createBasket,
    addItem,
    updateQuantity,
    removeItem,
    completeTransfer,
    clearError,
    refetch,

    // Loading states
    isCreating: createBasketMutation.isPending,
    isAddingItem: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
}
