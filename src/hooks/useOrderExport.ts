/**
 * useOrderExport.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React hooks for deterministic order export and label generation.
 *
 * The KEY pattern: `cutoffTimestamp` is captured with new Date().toISOString()
 * at the EXACT MOMENT the user clicks the button — before any API call is made.
 * This freezes the snapshot window on the server side.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExportOptions {
  statusFilter?: string[];       // e.g. ['pending', 'processing']
}

interface BulkLabelsOptions {
  orderIds?: string[];           // omit for full auto-batch mode
}

interface ExportState {
  isLoading: boolean;
  error:     string | null;
}

// ── CSV / Excel Export ────────────────────────────────────────────────────────

/**
 * useOrderExport
 *
 * Usage:
 *   const { exportOrders, isLoading, error } = useOrderExport();
 *
 *   // In your button handler:
 *   <button onClick={() => exportOrders()}>Export CSV</button>
 */
export function useOrderExport() {
  const [state, setState] = useState<ExportState>({ isLoading: false, error: null });

  const exportOrders = useCallback(async (options: ExportOptions = {}) => {
    setState({ isLoading: true, error: null });

    // ── CRITICAL: Capture the cutoff BEFORE the fetch, not inside it ────────
    // This is the "snapshot freeze" moment. Any order created after this
    // timestamp will not appear in the export, regardless of how long the
    // server takes to build the file.
    const cutoffTimestamp = new Date().toISOString();

    try {
      const response = await fetch('/api/admin/orders/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cutoffTimestamp,                          // ← Snapshot anchor
          statusFilter: options.statusFilter,       // optional status override
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error ?? 'Export failed');
      }

      // ── Download the file ────────────────────────────────────────────────
      const blob     = await response.blob();
      const date     = cutoffTimestamp.split('T')[0];
      const filename =
        response.headers.get('content-disposition')
          ?.match(/filename="?([^"]+)"?/)?.[1]
        ?? `orders-export-${date}.csv`;

      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Expose diagnostic info from server headers
      const count = response.headers.get('x-export-count');
      console.info(`[Export] Downloaded ${count ?? '?'} orders. Cutoff: ${cutoffTimestamp}`);

      setState({ isLoading: false, error: null });

    } catch (err: any) {
      const message = err?.message ?? 'Unknown export error';
      console.error('[Export] Error:', message);
      setState({ isLoading: false, error: message });
    }
  }, []);

  return { exportOrders, ...state };
}

// ── Bulk Label Generation ─────────────────────────────────────────────────────

/**
 * useBulkLabels
 *
 * Usage (manual selection):
 *   const { downloadLabels, isLoading, error } = useBulkLabels();
 *   <button onClick={() => downloadLabels({ orderIds: selectedIds })}>
 *     Download Labels
 *   </button>
 *
 * Usage (auto-batch — all pending orders):
 *   <button onClick={() => downloadLabels()}>Ready to Ship</button>
 */
export function useBulkLabels() {
  const [state, setState] = useState<ExportState>({ isLoading: false, error: null });

  const downloadLabels = useCallback(async (options: BulkLabelsOptions = {}) => {
    setState({ isLoading: true, error: null });

    // ── CRITICAL: Snapshot anchor captured here, before the API call ────────
    const cutoffTimestamp = new Date().toISOString();

    try {
      const response = await fetch('/api/admin/orders/bulk-labels', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          cutoffTimestamp,              // ← Snapshot anchor
          orderIds: options.orderIds,   // undefined = auto-batch all pending
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Label generation failed' }));
        throw new Error(err.error ?? 'Label generation failed');
      }

      // ── Download PDF ─────────────────────────────────────────────────────
      const blob     = await response.blob();
      const date     = cutoffTimestamp.split('T')[0];
      const filename =
        response.headers.get('content-disposition')
          ?.match(/filename="?([^"]+)"?/)?.[1]
        ?? `shipping-labels-${date}.pdf`;

      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const count  = response.headers.get('x-labels-count');
      const errors = response.headers.get('x-labels-errors');
      console.info(
        `[Labels] Downloaded ${count ?? '?'} labels ` +
        `(${errors ?? '0'} errors). Cutoff: ${cutoffTimestamp}`,
      );

      setState({ isLoading: false, error: null });

    } catch (err: any) {
      const message = err?.message ?? 'Unknown label generation error';
      console.error('[Labels] Error:', message);
      setState({ isLoading: false, error: message });
    }
  }, []);

  return { downloadLabels, ...state };
}
