'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Minus, Plus, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useTransferBasket, TransferBasketItem } from '@/hooks/use-transfer-basket';

interface BasketPreviewProps {
  basketId: string;
  onComplete: () => void;
}

export function BasketPreview({ basketId, onComplete }: BasketPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    basket,
    items,
    totalItems,
    totalQuantity,
    hasInvalidItems,
    canComplete,
    updateQuantity,
    removeItem,
    completeTransfer,
    isUpdating,
    isRemoving,
    isCompleting,
  } = useTransferBasket(basketId);

  const handleComplete = async () => {
    if (!canComplete) return;

    const confirmed = window.confirm(
      `Kas oled kindel, et tahad üle viia ${totalItems} toodet (${totalQuantity} tk)?`
    );

    if (confirmed) {
      await completeTransfer();
      onComplete();
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 z-40 ${
        isExpanded ? 'h-[70vh]' : 'h-36'
      }`}
    >
      {/* Handle */}
      <div
        className="flex justify-center pt-2 pb-1 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div
        className="px-4 py-3 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              Ülekande korv ({totalItems})
            </span>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="text-sm text-gray-500">
            Kokku: {totalQuantity} tk
          </div>
        </div>

        {/* Destination info */}
        {basket && (
          <div className="text-sm text-gray-600 mt-1">
            {basket.to_project && (
              <span>→ Projekt: {basket.to_project.name}</span>
            )}
            {basket.to_warehouse && (
              <span>→ Ladu: {basket.to_warehouse.name}</span>
            )}
            {basket.to_user && (
              <span>→ Kasutaja: {basket.to_user.full_name}</span>
            )}
          </div>
        )}

        {/* Warnings */}
        {hasInvalidItems && (
          <div className="flex items-center gap-1 text-orange-600 text-sm mt-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Mõned tooted pole saadaval</span>
          </div>
        )}
      </div>

      {/* Items list (expanded view) */}
      {isExpanded && (
        <div className="overflow-y-auto h-[calc(70vh-180px)] px-4 py-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Korv on tühi</p>
              <p className="text-sm mt-1">Skänni QR-koode toodete lisamiseks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <BasketItemCard
                  key={item.assetId}
                  item={item}
                  onUpdateQuantity={(qty) => updateQuantity(item.assetId, qty)}
                  onRemove={() => removeItem(item.assetId)}
                  isUpdating={isUpdating}
                  isRemoving={isRemoving}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleComplete}
          disabled={!canComplete || isCompleting}
          className={`w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            canComplete && !isCompleting
              ? 'bg-[#279989] text-white hover:bg-[#1f7a6d]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Ülekande tegemisel...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Kinnita ülekanne ({totalItems} toodet)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface BasketItemCardProps {
  item: TransferBasketItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

function BasketItemCard({ item, onUpdateQuantity, onRemove, isUpdating, isRemoving }: BasketItemCardProps) {
  const [localQuantity, setLocalQuantity] = useState(item.requestedQuantity);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(item.availableQuantity, localQuantity + delta));
    setLocalQuantity(newQuantity);
    onUpdateQuantity(newQuantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.max(1, Math.min(item.availableQuantity, value));
    setLocalQuantity(newQuantity);
    onUpdateQuantity(newQuantity);
  };

  return (
    <div
      className={`border rounded-xl p-3 ${
        !item.isValid ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.assetName}
            className="w-14 h-14 object-cover rounded-lg bg-gray-100"
          />
        ) : (
          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
            Pilt
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.assetName}</p>
          <p className="text-xs text-gray-500 truncate">{item.qrCode}</p>

          {/* Stock info */}
          <div className="mt-1">
            {item.isValid ? (
              <span className="text-xs text-green-600">
                Laos: {item.availableQuantity} tk
              </span>
            ) : (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Pole laos saadaval!
              </span>
            )}
          </div>

          {/* Warnings */}
          {item.warnings.map((warning, i) => (
            <div key={i} className="text-xs text-orange-600 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>

        {/* Quantity controls */}
        {item.isValid && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={localQuantity <= 1 || isUpdating}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={localQuantity}
              onChange={handleInputChange}
              min="1"
              max={item.availableQuantity}
              className="w-12 text-center border border-gray-200 rounded-lg py-1 text-sm"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={localQuantity >= item.availableQuantity || isUpdating}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
