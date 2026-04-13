import BookingDetailPage from "@/app/pages/bookings/BookingDetailPage";

export const metadata = {
  title: "Booking Details - CMBM",
  description: "View and manage booking details in the Construction Monitoring & Building Management System.",
};

export default function Page({ params }: { params: { id: string } }) {
  return <BookingDetailPage id={params.id} />;
}
