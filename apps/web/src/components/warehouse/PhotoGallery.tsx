'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Image as ImageIcon, Star, Trash2, ZoomIn } from 'lucide-react';

interface AssetPhoto {
  id: string;
  file_url: string;
  thumbnail_url?: string;
  photo_type: 'general' | 'check_in' | 'check_out' | 'damage' | 'repair' | 'maintenance';
  category?: 'before' | 'after' | 'damage' | 'current';
  title?: string;
  description?: string;
  is_primary: boolean;
  taken_at: string;
  taken_by?: { id: string; full_name: string };
}

interface PhotoGalleryProps {
  assetId: string;
  editable?: boolean;
}

export function PhotoGallery({ assetId, editable = true }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<AssetPhoto | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    file_url: '',
    photo_type: 'general' as const,
    title: '',
    description: '',
    is_primary: false,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: AssetPhoto[] }>({
    queryKey: ['asset-photos', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${assetId}/photos`);
      if (!res.ok) throw new Error('Failed to fetch photos');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/warehouse/assets/${assetId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add photo');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-photos', assetId] });
      setShowAddForm(false);
      setFormData({ file_url: '', photo_type: 'general', title: '', description: '', is_primary: false });
    },
  });

  const photoTypeLabels: Record<string, string> = {
    general: 'Üldine',
    check_in: 'Sisseregistreerimine',
    check_out: 'Väljaregistreerimine',
    damage: 'Kahjustus',
    repair: 'Remont',
    maintenance: 'Hooldus',
  };

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold">Fotod</h3>
          {data?.data && <span className="text-sm text-slate-400">({data.data.length})</span>}
        </div>
        {editable && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-white"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" /> Lisa foto
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="p-4 border-b bg-slate-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Foto URL</label>
              <input
                type="url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tüüp</label>
              <select
                value={formData.photo_type}
                onChange={(e) => setFormData({ ...formData, photo_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.entries(photoTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pealkiri</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Valikuline"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Kirjeldus</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Valikuline"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Peamine foto</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.file_url}
              className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: '#279989' }}
            >
              {createMutation.isPending ? 'Salvestan...' : 'Salvesta'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
            >
              Tühista
            </button>
          </div>
          {createMutation.error && (
            <p className="mt-2 text-sm text-red-600">{createMutation.error.message}</p>
          )}
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Laadimine...</div>
        ) : !data?.data?.length ? (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p className="text-slate-500">Fotosid pole veel lisatud</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.data.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.thumbnail_url || photo.file_url}
                  alt={photo.title || 'Vara foto'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {photo.is_primary && (
                  <div className="absolute top-2 left-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-xs text-white">{photoTypeLabels[photo.photo_type]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.file_url}
              alt={selectedPhoto.title || 'Vara foto'}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="mt-4 text-white">
              {selectedPhoto.title && <h4 className="font-semibold">{selectedPhoto.title}</h4>}
              {selectedPhoto.description && <p className="text-sm text-white/80">{selectedPhoto.description}</p>}
              <div className="flex gap-4 mt-2 text-sm text-white/60">
                <span>{photoTypeLabels[selectedPhoto.photo_type]}</span>
                <span>{new Date(selectedPhoto.taken_at).toLocaleDateString('et-EE')}</span>
                {selectedPhoto.taken_by && <span>{selectedPhoto.taken_by.full_name}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
