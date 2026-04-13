import BookingDetailPage from "@/app/pages/bookings/BookingDetailPage";

export const metadata = {
  title: "Booking Details - CMBM",
  description:
    "View and manage booking details in the Construction Monitoring & Building Management System.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingDetailPage id={id} />;
}
