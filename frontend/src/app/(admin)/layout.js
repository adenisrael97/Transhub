import AdminShell from "@/components/shared/AdminShell";

export const metadata = {
  title: "Admin Dashboard",
  description: "TransHub admin panel — manage trips, bookings, operators, and analytics.",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
