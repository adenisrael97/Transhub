import DriverShell from '@/components/shared/DriverShell';

export const metadata = {
  title: 'Driver Dashboard',
  description: 'Manage your availability, view upcoming trips, and track your schedule.',
};

export default function DriverLayout({ children }) {
  return <DriverShell>{children}</DriverShell>;
}
