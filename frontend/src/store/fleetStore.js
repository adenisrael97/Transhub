import { create } from 'zustand';

/**
 * Fleet availability store.
 * Controls whether a driver's bus is visible to admins and passengers.
 * Not persisted — in production this will be backed by an API.
 */
const useFleetStore = create(
    (set, get) => ({
      drivers: [
        {
          id: 'DRV-001',
          name: 'Emeka Okafor',
          operator: 'Peace Mass Transit',
          vehicleLabel: 'Bus PMT-204',
          routeLabel: 'Lagos → Abuja',
          isAvailable: true,
        },
        {
          id: 'DRV-002',
          name: 'Amina Yusuf',
          operator: 'GUO Transport',
          vehicleLabel: 'Luxury Bus GUO-118',
          routeLabel: 'Abuja → Port Harcourt',
          isAvailable: true,
        },
        {
          id: 'DRV-003',
          name: 'Bello Musa',
          operator: 'ABC Transport',
          vehicleLabel: 'Bus ABC-072',
          routeLabel: 'Kano → Lagos',
          isAvailable: false,
        },
      ],

      trips: [
        {
          id: '1',
          driverId: 'DRV-001',
          from: 'Lagos',
          to: 'Abuja',
          departureTime: '2026-04-02T06:00:00',
          arrivalTime: '2026-04-02T13:00:00',
          operator: 'Peace Mass Transit',
          price: 9500,
          availableSeats: 12,
          totalSeats: 18,
          vehicleType: 'Bus',
        },
        {
          id: '2',
          driverId: 'DRV-002',
          from: 'Abuja',
          to: 'Port Harcourt',
          departureTime: '2026-04-02T08:00:00',
          arrivalTime: '2026-04-02T16:00:00',
          operator: 'GUO Transport',
          price: 12000,
          availableSeats: 13,
          totalSeats: 33,
          vehicleType: 'Luxury Bus',
        },
        {
          id: '3',
          driverId: 'DRV-003',
          from: 'Kano',
          to: 'Lagos',
          departureTime: '2026-04-02T07:00:00',
          arrivalTime: '2026-04-02T19:30:00',
          operator: 'ABC Transport',
          price: 15000,
          availableSeats: 9,
          totalSeats: 18,
          vehicleType: 'Bus',
        },
      ],

      setDriverAvailability(driverId, isAvailable) {
        set((state) => ({
          drivers: state.drivers.map((driver) =>
            driver.id === driverId ? { ...driver, isAvailable } : driver
          ),
        }));
      },

      getDriver(driverId) {
        return get().drivers.find((driver) => driver.id === driverId) ?? null;
      },

      /**
       * Trips visible to users and admin "active trips" widgets.
       * Only includes trips with an available driver.
       */
      getVisibleTrips(filters = {}) {
        const { from, to, date } = filters;
        const availableDriverIds = new Set(
          get()
            .drivers.filter((driver) => driver.isAvailable)
            .map((driver) => driver.id)
        );

        return get().trips.filter((trip) => {
          if (!availableDriverIds.has(trip.driverId)) return false;
          if (from && trip.from !== from) return false;
          if (to && trip.to !== to) return false;
          if (date && !trip.departureTime.startsWith(date)) return false;
          return true;
        });
      },
    }),
);

export default useFleetStore;
