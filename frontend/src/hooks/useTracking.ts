"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchWaybill as fetchWaybillApi } from "@/services/waybills";
import { connectSocket } from "@/lib/socket";
import { getErrorMessage } from "@/lib/utils";
import type { Waybill } from "@/types";

interface UseTrackingReturn {
  waybill: Waybill | null;
  loading: boolean;
  error: string | null;
  fetchWaybill: (no: string) => Promise<void>;
}

/**
 * Waybill tracking hook — fetches waybill data and subscribes to
 * real-time updates via WebSocket while a waybillNo is active.
 */
export function useTracking(waybillNo?: string): UseTrackingReturn {
  const [waybill, setWaybill] = useState<Waybill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWaybill = useCallback(async (no: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWaybillApi(no);
      setWaybill(data);
    } catch (err) {
      setError(getErrorMessage(err, "Waybill not found"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time status pushes while a waybillNo is active
  useEffect(() => {
    if (!waybillNo) return;
    const socket = connectSocket();
    socket.emit("track:waybill", waybillNo);
    const handler = (update: Partial<Waybill>) => {
      setWaybill((prev) => (prev ? { ...prev, ...update } : (update as Waybill)));
    };
    socket.on("waybill:update", handler);
    return () => {
      socket.off("waybill:update", handler);
      socket.emit("untrack:waybill", waybillNo);
    };
  }, [waybillNo]);

  return { waybill, loading, error, fetchWaybill };
}
