import OperatorShell from "@/components/shared/OperatorShell";

export const metadata = {
  title: "Operator Portal",
  description: "TransHub operator portal — manage your fleet, trips, bookings, and company profile.",
};

export default function OperatorLayout({ children }) {
  return <OperatorShell>{children}</OperatorShell>;
}
