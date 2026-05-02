import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateTaxes } from "@/lib/taxes";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function InvoicePage({ params }: Props) {
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
  const invoiceNumber = `QH-INV-${String(booking.id).padStart(5, "0")}`;
  const invoiceDate = booking.payment?.paymentDate
    ? new Date(booking.payment.paymentDate)
    : new Date(booking.createdAt);

  return (
    <div className="min-h-screen bg-gray-100 py-10 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto print:max-w-full">
        {/* Print controls (hidden when printing) */}
        <div className="flex gap-3 mb-6 print:hidden">
          <button
            onClick={() => (typeof window !== "undefined" && window.print())}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Print / Save PDF
          </button>
          <Link href={`/receipt/${bookingId}`} className="text-sm text-blue-600 hover:underline flex items-center">
            ← Back to Receipt
          </Link>
        </div>

        {/* Invoice */}
        <div className="bg-white shadow-sm rounded-xl p-10 print:shadow-none print:rounded-none">
          {/* Letterhead */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></h1>
              <p className="text-gray-500 text-sm mt-1">Service Marketplace · Ghana</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">INVOICE</p>
              <p className="text-gray-500 text-sm mt-1">{invoiceNumber}</p>
              <p className="text-gray-400 text-xs mt-1">
                {invoiceDate.toLocaleDateString("en-GH", { timeZone: "Africa/Accra" })}
              </p>
            </div>
          </div>

          {/* Bill To / From */}
          <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-semibold text-gray-900">{booking.user.fullName}</p>
              <p className="text-gray-500">{booking.user.email}</p>
              {booking.user.phone && <p className="text-gray-500">{booking.user.phone}</p>}
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Service Provider</p>
              <p className="font-semibold text-gray-900">{booking.provider.user.fullName}</p>
              <p className="text-gray-500">{booking.provider.serviceCategory}</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-gray-500 font-medium">Description</th>
                <th className="text-right py-3 text-gray-500 font-medium">Qty</th>
                <th className="text-right py-3 text-gray-500 font-medium">Unit Price</th>
                <th className="text-right py-3 text-gray-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-gray-900">
                  {booking.service.serviceName}
                  {booking.service.description && (
                    <p className="text-gray-400 text-xs mt-1">{booking.service.description}</p>
                  )}
                </td>
                <td className="py-3 text-right text-gray-900">1</td>
                <td className="py-3 text-right text-gray-900">GH₵ {basePrice.toFixed(2)}</td>
                <td className="py-3 text-right text-gray-900">GH₵ {basePrice.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
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
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span className="text-gray-900">Total</span>
              <span className="text-blue-600">GH₵ {taxes.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-10 pt-6 border-t">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                  booking.payment?.paymentStatus === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {booking.payment?.paymentStatus === "completed" ? "PAID" : "PAYMENT PENDING"}
                </span>
                {booking.payment?.paymentMethod && (
                  <span className="ml-2 text-gray-400 capitalize">{booking.payment.paymentMethod.replace("_", " ")}</span>
                )}
              </div>
              <p className="text-gray-400 text-xs">Booking Ref: #{booking.id}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t text-center text-gray-400 text-xs">
            <p>QuickHire — Ghana&apos;s service marketplace. Thank you for your business.</p>
            <p className="mt-1">For queries, contact support via the QuickHire platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
