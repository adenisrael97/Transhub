import { create } from 'zustand';

/**
 * Operator registration request store.
 * Not persisted — in production this will be backed by an API.
 */

const SEED_OPERATORS = [
  {
    id: 'OP-001',
    companyName: 'Peace Mass Transit',
    contactName: 'Obiora Nwankwo',
    email: 'info@peacemasstransit.com',
    phone: '08031234567',
    city: 'Enugu',
    fleetSize: '120+',
    vehicleTypes: ['Bus', 'Luxury Bus'],
    routes: 'Lagos, Abuja, Enugu, Owerri, Port Harcourt',
    yearsInOperation: '15+',
    cacNumber: 'RC-123456',
    status: 'approved',
    appliedAt: '2026-01-10T09:00:00',
    reviewedAt: '2026-01-11T14:30:00',
  },
  {
    id: 'OP-002',
    companyName: 'GUO Transport',
    contactName: 'George Uko',
    email: 'partners@guotransport.ng',
    phone: '08029876543',
    city: 'Lagos',
    fleetSize: '80+',
    vehicleTypes: ['Bus', 'Luxury Bus', 'Coaster'],
    routes: 'Lagos, Abuja, Kano, Port Harcourt',
    yearsInOperation: '20+',
    cacNumber: 'RC-654321',
    status: 'approved',
    appliedAt: '2026-01-15T10:30:00',
    reviewedAt: '2026-01-16T09:00:00',
  },
  {
    id: 'OP-003',
    companyName: 'Nnewi Express Logistics',
    contactName: 'Chidi Obi',
    email: 'chidi@nnewi-express.com',
    phone: '07045678901',
    city: 'Nnewi',
    fleetSize: '12',
    vehicleTypes: ['Bus', 'Coaster'],
    routes: 'Lagos, Onitsha, Nnewi, Aba',
    yearsInOperation: '3',
    cacNumber: 'RC-998877',
    status: 'pending',
    appliedAt: '2026-03-23T15:20:00',
    reviewedAt: null,
  },
  {
    id: 'OP-004',
    companyName: 'Kano Star Motors',
    contactName: 'Abubakar Sani',
    email: 'abubakar@kanostarmotors.ng',
    phone: '08061122334',
    city: 'Kano',
    fleetSize: '25',
    vehicleTypes: ['Bus', 'SUV'],
    routes: 'Kano, Kaduna, Abuja, Jos',
    yearsInOperation: '7',
    cacNumber: 'RC-556677',
    status: 'pending',
    appliedAt: '2026-03-24T08:45:00',
    reviewedAt: null,
  },
];

const useOperatorStore = create(
    (set, get) => ({
      operators: SEED_OPERATORS,

      /** Add a new operator request (status defaults to 'pending'). */
      addOperator(data) {
        const id = `OP-${String(get().operators.length + 1).padStart(3, '0')}`;
        const operator = {
          ...data,
          id,
          status: 'pending',
          appliedAt: new Date().toISOString(),
          reviewedAt: null,
        };
        set((s) => ({ operators: [operator, ...s.operators] }));
        return operator;
      },

      /** Admin approves an operator. */
      approveOperator(id) {
        set((s) => ({
          operators: s.operators.map((o) =>
            o.id === id ? { ...o, status: 'approved', reviewedAt: new Date().toISOString() } : o
          ),
        }));
      },

      /** Admin declines an operator. */
      declineOperator(id) {
        set((s) => ({
          operators: s.operators.map((o) =>
            o.id === id ? { ...o, status: 'declined', reviewedAt: new Date().toISOString() } : o
          ),
        }));
      },

      /** Get counts by status. */
      getCounts() {
        const ops = get().operators;
        return {
          total: ops.length,
          pending: ops.filter((o) => o.status === 'pending').length,
          approved: ops.filter((o) => o.status === 'approved').length,
          declined: ops.filter((o) => o.status === 'declined').length,
        };
      },
    }),
);

export default useOperatorStore;
