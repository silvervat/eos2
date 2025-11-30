'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit, Trash2, FolderTree, AlertTriangle, X,
  ChevronRight, ChevronDown, Download, Upload, Package,
  AlertCircle, Loader2, FileSpreadsheet
} from 'lucide-react';

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  path: string;
  level: number;
  icon?: string;
  color?: string;
  is_consumable: boolean;
  requires_maintenance: boolean;
  maintenance_interval_days?: number;
  min_stock_quantity?: number;
  reorder_point?: number;
  unit_of_measure?: string;
  // Stock info (when with_stock=true)
  total_stock?: number;
  asset_count?: number;
  stock_status?: 'ok' | 'low' | 'critical';
  children?: Category[];
}

interface FormData {
  code: string;
  name: string;
  parent_id: string;
  description: string;
  icon: string;
  color: string;
  is_consumable: boolean;
  requires_maintenance: boolean;
  maintenance_interval_days: number;
  min_stock_quantity: number;
  reorder_point: number;
  unit_of_measure: string;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  parent_id: '',
  description: '',
  icon: '',
  color: '#3b82f6',
  is_consumable: false,
  requires_maintenance: false,
  maintenance_interval_days: 0,
  min_stock_quantity: 0,
  reorder_point: 0,
  unit_of_measure: 'tk',
};

const unitOptions = ['tk', 'm', 'kg', 'l', 'paar', 'pk', 'karp', 'rull'];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<{ message: string; errors?: { row: number; code: string; error: string }[] } | null>(null);

  // Fetch all categories with stock info
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories-flat-stock'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/categories?flat=true&with_stock=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  const categories: Category[] = categoriesData?.data || [];

  // Count warnings
  const lowStockCount = categories.filter(c => c.stock_status === 'low').length;
  const criticalStockCount = categories.filter(c => c.stock_status === 'critical').length;

  // Build tree structure
  const buildTree = (items: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    items.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const categoryTree = buildTree(categories);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const res = await fetch('/api/warehouse/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-flat-stock'] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const res = await fetch(`/api/warehouse/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-flat-stock'] });
      closeModal();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouse/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-flat-stock'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const res = await fetch('/api/warehouse/categories/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories-flat-stock'] });
      setImportResult(data);
    },
  });

  const openCreateModal = (parentId?: string) => {
    setEditingCategory(null);
    setFormData({ ...defaultFormData, parent_id: parentId || '' });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      code: category.code,
      name: category.name,
      parent_id: category.parent_id || '',
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3b82f6',
      is_consumable: category.is_consumable,
      requires_maintenance: category.requires_maintenance,
      maintenance_interval_days: category.maintenance_interval_days || 0,
      min_stock_quantity: category.min_stock_quantity || 0,
      reorder_point: category.reorder_point || 0,
      unit_of_measure: category.unit_of_measure || 'tk',
    });
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(defaultFormData);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.code || !formData.name) {
      setError('Kood ja nimi on kohustuslikud');
      return;
    }

    const submitData = {
      ...formData,
      parent_id: formData.parent_id || undefined,
      maintenance_interval_days: formData.requires_maintenance ? formData.maintenance_interval_days : 0,
      min_stock_quantity: formData.is_consumable ? formData.min_stock_quantity : 0,
      reorder_point: formData.is_consumable ? formData.reorder_point : 0,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (category: Category) => {
    if (category.children && category.children.length > 0) {
      alert('Ei saa kustutada kategooriat, millel on alamkategooriad');
      return;
    }
    if (confirm(`Kas oled kindel, et soovid kategooria "${category.name}" kustutada?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleExport = () => {
    window.open('/api/warehouse/categories/export?format=csv', '_blank');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
      e.target.value = '';
    }
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getStockBadge = (category: Category) => {
    if (!category.is_consumable) return null;

    if (category.stock_status === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          Kriitiline: {category.total_stock || 0} {category.unit_of_measure}
        </span>
      );
    }

    if (category.stock_status === 'low') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
          <AlertCircle className="h-3 w-3" />
          Madal: {category.total_stock || 0} {category.unit_of_measure}
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
        {category.total_stock || 0} {category.unit_of_measure}
      </span>
    );
  };

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 ${
            category.stock_status === 'critical' ? 'bg-red-50/50' :
            category.stock_status === 'low' ? 'bg-yellow-50/50' : ''
          }`}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-slate-200 rounded">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          <div
            className="w-4 h-4 rounded-full flex-shrink-0 border-2"
            style={{ backgroundColor: category.color || '#3b82f6', borderColor: category.color || '#3b82f6' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-900">{category.name}</span>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {category.code}
              </span>

              {category.is_consumable && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  Tükikaup
                </span>
              )}

              {category.requires_maintenance && (
                <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                  Hooldus
                </span>
              )}

              {getStockBadge(category)}
            </div>

            {category.description && (
              <p className="text-sm text-slate-500 truncate mt-0.5">{category.description}</p>
            )}

            {category.is_consumable && (category.min_stock_quantity || 0) > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Min: {category.min_stock_quantity} {category.unit_of_measure}
                {(category.reorder_point || 0) > 0 && ` | Tellimispunkt: ${category.reorder_point} ${category.unit_of_measure}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-2">
              {category.asset_count || 0} vara
            </span>
            <button
              onClick={() => openCreateModal(category.id)}
              className="p-2 text-slate-400 hover:text-[#279989] hover:bg-[#279989]/10 rounded-lg"
              title="Lisa alamkategooria"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => openEditModal(category)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Muuda"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Kustuta"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{category.children!.map(child => renderCategory(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategooriad</h1>
          <p className="text-slate-600 text-sm mt-1">
            Varade ja tükikaupade kategooriate haldamine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
          >
            {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" />
            Lisa kategooria
          </button>
        </div>
      </div>

      {/* Warnings summary */}
      {(criticalStockCount > 0 || lowStockCount > 0) && (
        <div className="flex gap-4">
          {criticalStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">{criticalStockCount} kategooriat kriitilise laoseisuga</span>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-yellow-700 font-medium">{lowStockCount} kategooriat madala laoseisuga</span>
            </div>
          )}
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className={`p-4 rounded-lg border ${importResult.errors?.length ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <span className="font-medium">{importResult.message}</span>
            </div>
            <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mt-2 text-sm text-yellow-700">
              <p className="font-medium">Vead:</p>
              <ul className="list-disc list-inside">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>Rida {err.row} ({err.code}): {err.error}</li>
                ))}
                {importResult.errors.length > 5 && <li>...ja veel {importResult.errors.length - 5} viga</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Categories Tree */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tree controls */}
        {categories.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
            <span className="text-sm text-slate-600">{categories.length} kategooriat</span>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-xs text-slate-500 hover:text-slate-700">Ava kõik</button>
              <span className="text-slate-300">|</span>
              <button onClick={collapseAll} className="text-xs text-slate-500 hover:text-slate-700">Sulge kõik</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#279989]" />
          </div>
        ) : categoryTree.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Kategooriaid pole veel lisatud</p>
            <button
              onClick={() => openCreateModal()}
              className="mt-4 text-[#279989] hover:underline"
            >
              Lisa esimene kategooria
            </button>
          </div>
        ) : (
          <div>{categoryTree.map(category => renderCategory(category))}</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editingCategory ? 'Muuda kategooriat' : 'Lisa uus kategooria'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kood *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="KINDAD"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nimi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Talvekindad"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ülemkategooria</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                >
                  <option value="">Juurkategooria (ülemine tase)</option>
                  {categories
                    .filter((c: Category) => c.id !== editingCategory?.id)
                    .map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {'—'.repeat(c.level)} {c.name} ({c.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kirjeldus</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Värv</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Consumable settings */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_consumable}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_consumable: e.target.checked }))}
                    className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    <Package className="h-4 w-4 inline mr-1" />
                    Tükikaupade kategooria
                  </span>
                </label>

                {formData.is_consumable && (
                  <div className="ml-6 space-y-3 pt-2 border-t border-blue-200">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Min kogus
                        </label>
                        <input
                          type="number"
                          value={formData.min_stock_quantity || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, min_stock_quantity: parseInt(e.target.value) || 0 }))}
                          min="0"
                          placeholder="10"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tellimispunkt
                        </label>
                        <input
                          type="number"
                          value={formData.reorder_point || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: parseInt(e.target.value) || 0 }))}
                          min="0"
                          placeholder="20"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Ühik
                        </label>
                        <select
                          value={formData.unit_of_measure}
                          onChange={(e) => setFormData(prev => ({ ...prev, unit_of_measure: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                        >
                          {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Kui laoseis langeb alla min koguse, kuvatakse hoiatus
                    </p>
                  </div>
                )}
              </div>

              {/* Maintenance settings */}
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_maintenance}
                    onChange={(e) => setFormData(prev => ({ ...prev, requires_maintenance: e.target.checked }))}
                    className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-700">Vajab regulaarset hooldust</span>
                </label>

                {formData.requires_maintenance && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hooldusintervall (päevades)
                    </label>
                    <input
                      type="number"
                      value={formData.maintenance_interval_days || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, maintenance_interval_days: parseInt(e.target.value) || 0 }))}
                      min="1"
                      placeholder="90"
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#279989' }}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingCategory ? 'Salvesta' : 'Lisa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
