'use client';
import { useState, useCallback } from 'react';
import { searchTrips as searchTripsApi, fetchTrip as fetchTripApi } from '@/services/trips';
import { createBooking } from '@/services/bookings';

export function useTrips() {
  const [trips, setTrips]   = useState([]);
  const [trip, setTrip]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  /** Search available trips: { from, to, date, passengers } */
  const searchTrips = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchTripsApi(params);
      setTrips(data.trips ?? data ?? []);
    } catch (err) {
      setError(err.message ?? 'Could not fetch trips');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Get a single trip by ID (includes seats array) */
  const fetchTrip = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTripApi(id);
      setTrip(data.trip ?? data);
    } catch (err) {
      setError(err.message ?? 'Trip not found');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Create a booking: { tripId, seats, passengers, paymentMethod } */
  const bookTrip = useCallback(async (payload) => {
    return createBooking(payload);
  }, []);

  return { trips, trip, loading, error, searchTrips, fetchTrip, bookTrip };
}
