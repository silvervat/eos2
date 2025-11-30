'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Download, Printer, Copy, Check } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    asset_code: string;
    name: string;
    qr_code?: string;
  };
}

export function QRCodeModal({ isOpen, onClose, asset }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code using canvas
  useEffect(() => {
    if (!isOpen || !asset.asset_code) return;

    const generateQR = async () => {
      // Using a simple QR code generation approach
      // In production, you might want to use a proper library like 'qrcode'
      const qrValue = asset.qr_code || `ASSET-${asset.asset_code}`;

      // Generate QR code using an API service (temporary solution)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`;
      setQrDataUrl(qrUrl);
    };

    generateQR();
  }, [isOpen, asset]);

  const handleCopy = async () => {
    const qrValue = asset.qr_code || `ASSET-${asset.asset_code}`;
    await navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${asset.asset_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrValue = asset.qr_code || `ASSET-${asset.asset_code}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Kood - ${asset.asset_code}</title>
          <style>
            @page {
              size: 50mm 70mm;
              margin: 5mm;
            }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 10px;
              box-sizing: border-box;
            }
            .qr-container {
              text-align: center;
            }
            .qr-code {
              width: 40mm;
              height: 40mm;
            }
            .asset-code {
              font-size: 12pt;
              font-weight: bold;
              margin-top: 5mm;
              font-family: monospace;
            }
            .asset-name {
              font-size: 10pt;
              margin-top: 2mm;
              max-width: 45mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img class="qr-code" src="${qrDataUrl}" alt="QR Code" />
            <div class="asset-code">${asset.asset_code}</div>
            <div class="asset-name">${asset.name}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">QR kood</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-64 h-64 border border-slate-200 rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}

            <div className="mt-4 text-center">
              <p className="font-mono text-lg font-bold">{asset.asset_code}</p>
              <p className="text-slate-600">{asset.name}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Kopeeritud
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Kopeeri
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Laadi alla
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#279989' }}
            >
              <Printer className="h-4 w-4" />
              Prindi
            </button>
          </div>

          {/* QR Value Info */}
          <div className="mt-6 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">QR koodi sisu:</p>
            <p className="font-mono text-sm break-all">
              {asset.qr_code || `ASSET-${asset.asset_code}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
