import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateTaxes, COMMISSION_RATE } from "@/lib/taxes";
import ReceiptActions from "./ReceiptActions";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function ReceiptPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/auth");

  let booking: any = null;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        provider: { include: { user: { select: { fullName: true, email: true } } } },
        service: true,
        payment: true,
        reviews: { where: { userId: parseInt(session.user.id) } },
        payout: true,
      },
    });
  } catch {
    notFound();
  }

  if (!booking) notFound();

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType;
  const isCustomer = booking.userId === userId;
  const isProviderOwner = booking.provider.userId === userId;
  const isAdmin = userType === "admin";

  if (!isCustomer && !isProviderOwner && !isAdmin) redirect("/dashboard");

  const basePrice = Number(booking.service.price);
  const taxes = calculateTaxes(basePrice);
  const commissionAmount = basePrice * COMMISSION_RATE;
  const payoutAmount = basePrice - commissionAmount;
  const paidAmount = booking.payment ? Number(booking.payment.amount) : taxes.total;

  const serialize = (d: any) => JSON.parse(JSON.stringify(d));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <nav className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Dashboard</Link>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6" id="receipt-content">
        {/* Header */}
        <div className="bg-white rounded-xl border p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Receipt</h1>
              <p className="text-gray-500 text-sm mt-1">Booking #{booking.id}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                booking.payment?.paymentStatus === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {booking.payment?.paymentStatus === "completed" ? "✓ Paid" : "Pending"}
              </span>
              {booking.payment?.paymentDate && (
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(booking.payment.paymentDate).toLocaleString("en-GH", { timeZone: "Africa/Accra" })}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Customer</p>
              <p className="font-medium text-gray-900">{booking.user.fullName}</p>
              <p className="text-gray-500">{booking.user.email}</p>
              {booking.user.phone && <p className="text-gray-500">{booking.user.phone}</p>}
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Service Provider</p>
              <p className="font-medium text-gray-900">{booking.provider.user.fullName}</p>
              <p className="text-gray-500">{booking.provider.serviceCategory}</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Service Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-gray-900">{booking.service.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Booking Date</span>
              <span className="text-gray-900">{new Date(booking.bookingDate).toLocaleString("en-GH", { timeZone: "Africa/Accra" })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Address</span>
              <span className="text-gray-900">{booking.address}</span>
            </div>
            {booking.notes && (
              <div className="flex justify-between">
                <span className="text-gray-500">Notes</span>
                <span className="text-gray-900 max-w-xs text-right">{booking.notes}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-900 capitalize">{booking.payment?.paymentMethod?.replace("_", " ") ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tax Breakdown (Ghana)</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Service Price</span>
              <span className="text-gray-900">GH₵ {basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">VAT (15%)</span>
              <span className="text-gray-900">GH₵ {taxes.vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">NHIL (2.5%)</span>
              <span className="text-gray-900">GH₵ {taxes.nhil.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GETFund (2.5%)</span>
              <span className="text-gray-900">GH₵ {taxes.getfund.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span className="text-gray-900">Total Paid</span>
              <span className="text-blue-600 text-base">GH₵ {paidAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payout Breakdown (for provider) */}
        {(isProviderOwner || isAdmin) && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payout Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gross Amount</span>
                <span className="text-gray-900">GH₵ {paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Commission (10%)</span>
                <span className="text-red-600">– GH₵ {commissionAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span className="text-gray-900">Your Payout</span>
                <span className="text-green-600 text-base">GH₵ {payoutAmount.toFixed(2)}</span>
              </div>
            </div>
            {booking.payout && (
              <p className="text-xs text-gray-400 mt-3">Ref: {booking.payout.payoutReference}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <ReceiptActions
          bookingId={booking.id}
          providerId={booking.providerId}
          hasReview={booking.reviews.length > 0}
          paymentCompleted={booking.payment?.paymentStatus === "completed"}
          isCustomer={isCustomer}
          booking={serialize(booking)}
        />
      </div>
    </div>
  );
}
