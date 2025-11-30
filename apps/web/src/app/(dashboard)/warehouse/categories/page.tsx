'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderTree, Package, AlertCircle, X, ChevronRight, ChevronDown } from 'lucide-react';

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
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch all categories flat
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/categories?flat=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  const categories = categoriesData?.data || [];

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

  // Create mutation
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
      queryClient.invalidateQueries({ queryKey: ['categories-flat'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Update mutation
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
      queryClient.invalidateQueries({ queryKey: ['categories-flat'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouse/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-flat'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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

    const submitData: Partial<FormData> = {
      ...formData,
      parent_id: formData.parent_id || undefined,
      maintenance_interval_days: formData.requires_maintenance ? formData.maintenance_interval_days : 0,
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

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 border-b border-slate-100"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(category.id)} className="p-1">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || '#3b82f6' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{category.name}</span>
              <span className="text-xs text-slate-500 font-mono">{category.code}</span>
              {category.is_consumable && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  Tükikaup
                </span>
              )}
              {category.requires_maintenance && (
                <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                  Hooldus
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-slate-500 truncate">{category.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openCreateModal(category.id)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
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
          <div>
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
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

        <button
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Lisa kategooria
        </button>
      </div>

      {/* Categories Tree */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : categoryTree.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Kategooriaid pole veel lisatud</p>
            <button
              onClick={() => openCreateModal()}
              className="mt-4 text-primary hover:underline"
            >
              Lisa esimene kategooria
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categoryTree.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kood *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="TOOLS"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nimi *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tööriistad"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ülemkategooria
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Juurkategooria (ülemine tase)</option>
                  {categories
                    .filter((c: Category) => c.id !== editingCategory?.id)
                    .map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {c.path.replace(/\//g, ' > ')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kirjeldus
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Värv
                </label>
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
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_consumable}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_consumable: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Tükikaupade kategooria</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requires_maintenance}
                    onChange={(e) => setFormData(prev => ({ ...prev, requires_maintenance: e.target.checked }))}
                    className="rounded border-slate-300"
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
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
