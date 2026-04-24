'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchWaybill as fetchWaybillApi } from '@/services/waybills';
import { connectSocket } from '@/lib/socket';

/**
 * Waybill tracking hook — fetches waybill data and subscribes to
 * real-time updates via WebSocket while a waybillNo is active.
 * @param {string|undefined} waybillNo — auto-subscribes when provided
 * @returns {{ waybill, loading, error, fetchWaybill }}
 */
export function useTracking(waybillNo) {
  const [waybill, setWaybill]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchWaybill = useCallback(async (no) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWaybillApi(no);
      setWaybill(data);
    } catch (err) {
      setError(err.message ?? 'Waybill not found');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time status pushes while a waybillNo is active
  useEffect(() => {
    if (!waybillNo) return;
    const socket = connectSocket();
    socket.emit('track:waybill', waybillNo);
    const handler = (update) => {
      setWaybill((prev) => (prev ? { ...prev, ...update } : update));
    };
    socket.on('waybill:update', handler);
    return () => {
      socket.off('waybill:update', handler);
    };
  }, [waybillNo]);

  return { waybill, loading, error, fetchWaybill };
}
