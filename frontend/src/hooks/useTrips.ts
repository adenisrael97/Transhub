"use client";
import { useState, useCallback } from "react";
import {
  searchTrips as searchTripsApi,
  fetchTrip as fetchTripApi,
} from "@/services/trips";
import { getErrorMessage } from "@/lib/utils";
import type { Trip, TripSearchParams } from "@/types";

interface UseTripsReturn {
  trips:       Trip[];
  trip:        Trip | null;
  loading:     boolean;
  error:       string | null;
  searchTrips: (params: TripSearchParams) => Promise<void>;
  fetchTrip:   (id: string) => Promise<void>;
}

export function useTrips(): UseTripsReturn {
  const [trips,   setTrips]   = useState<Trip[]>([]);
  const [trip,    setTrip]    = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const searchTrips = useCallback(async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchTripsApi(params);
      setTrips(data.trips ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not fetch trips"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrip = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTripApi(id);
      setTrip(data.trip);
    } catch (err) {
      setError(getErrorMessage(err, "Trip not found"));
    } finally {
      setLoading(false);
    }
  }, []);

  return { trips, trip, loading, error, searchTrips, fetchTrip };
}
