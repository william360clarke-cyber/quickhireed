"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookingId: number;
  providerId: number;
  hasReview: boolean;
  paymentCompleted: boolean;
  isCustomer: boolean;
  booking: any;
}

export default function ReceiptActions({ bookingId, providerId, hasReview, paymentCompleted, isCustomer, booking }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [fbCategory, setFbCategory] = useState("general");
  const [fbMessage, setFbMessage] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [issueMessage, setIssueMessage] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [reviewDone, setReviewDone] = useState(false);
  const [fbDone, setFbDone] = useState(false);
  const [issueDone, setIssueDone] = useState(false);

  async function submitReview() {
    setLoading("review");
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, providerId, rating, comment }),
    });
    setLoading(null);
    setReviewDone(true);
    router.refresh();
  }

  async function submitFeedback() {
    setLoading("feedback");
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: fbCategory, message: fbMessage, rating: fbRating }),
    });
    setLoading(null);
    setFbDone(true);
  }

  async function submitIssue() {
    setLoading("issue");
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "issue", message: `Booking #${bookingId}: ${issueMessage}`, rating: 1 }),
    });
    setLoading(null);
    setIssueDone(true);
  }

  return (
    <div className="space-y-4">
      {/* Print / Invoice */}
      <div className="bg-white rounded-xl border p-6 flex gap-3 flex-wrap">
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Print Receipt
        </button>
        <a
          href={`/invoice/${bookingId}`}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          View Invoice
        </a>
      </div>

      {/* Review */}
      {isCustomer && paymentCompleted && !hasReview && !reviewDone && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Leave a Review</h3>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className={`text-2xl ${s <= rating ? "text-yellow-500" : "text-gray-300"}`}>★</button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this service provider…"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <button
            onClick={submitReview}
            disabled={loading === "review"}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === "review" ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      )}
      {reviewDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          ✓ Review submitted. Thank you!
        </div>
      )}

      {/* Platform Feedback */}
      {isCustomer && !fbDone && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Platform Feedback</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={fbCategory}
              onChange={(e) => setFbCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="general">General</option>
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="compliment">Compliment</option>
            </select>
            <div className="flex gap-1 items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setFbRating(s)} className={`text-xl ${s <= fbRating ? "text-yellow-500" : "text-gray-300"}`}>★</button>
              ))}
            </div>
          </div>
          <textarea
            value={fbMessage}
            onChange={(e) => setFbMessage(e.target.value)}
            placeholder="Tell us how we're doing…"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <button
            onClick={submitFeedback}
            disabled={loading === "feedback" || !fbMessage.trim()}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading === "feedback" ? "Sending…" : "Send Feedback"}
          </button>
        </div>
      )}
      {fbDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          ✓ Feedback received. Thank you!
        </div>
      )}

      {/* Report Issue */}
      {isCustomer && !issueDone && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Report an Issue</h3>
          <textarea
            value={issueMessage}
            onChange={(e) => setIssueMessage(e.target.value)}
            placeholder="Describe the issue you experienced…"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <button
            onClick={submitIssue}
            disabled={loading === "issue" || !issueMessage.trim()}
            className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading === "issue" ? "Sending…" : "Report Issue"}
          </button>
        </div>
      )}
      {issueDone && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
          ✓ Issue reported. We'll look into it.
        </div>
      )}
    </div>
  );
}
