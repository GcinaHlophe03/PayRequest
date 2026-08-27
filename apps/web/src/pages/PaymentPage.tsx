import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCheckout,
  getPublicPayment,
} from "../api";

interface Payment {
  id: string;
  senderName: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
}

export default function PaymentPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayment() {
      if (!token) return;

      try {
        const data = await getPublicPayment(token);
        setPayment(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, [token]);

  async function handlePay() {
    if (!token) return;

    try {
      setPaying(true);
      setError("");

      const checkout = await createCheckout(token);

      const url = new URL(checkout.checkoutUrl);

      const paymentId = url.searchParams.get("paymentId");

      if (!paymentId) {
        throw new Error("Invalid checkout response.");
      }

      navigate(
        `/success?paymentId=${paymentId}&token=${token}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start payment."
      );
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="center-page">
        <div className="spinner" />
        <p>Loading payment...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="center-page">
        <div className="payment-card">
          <div className="error-icon">!</div>

          <h1>Payment unavailable</h1>

          <p>{error || "Payment request not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-brand">
        Pay<span>Request</span>
      </div>

      <div className="payment-card">
        <p className="eyebrow">PAYMENT REQUEST</p>

        <div className="sender-avatar">
          {payment.senderName?.charAt(0) || "P"}
        </div>

        <h1>{payment.senderName}</h1>

        <p className="request-text">
          has requested a payment from you
        </p>

        <div className="requested-amount">
          <span>R</span>
          {payment.amount.toFixed(2)}
        </div>

        <div className="description">
          {payment.description}
        </div>

        <button
          className="primary-button full-width"
          onClick={handlePay}
          disabled={paying}
        >
          {paying
            ? "Opening checkout..."
            : `Pay R${payment.amount.toFixed(2)}`}
        </button>

        <p className="secure-text">
          🔒 Secure payment powered by PayRequest
        </p>
      </div>
    </div>
  );
}