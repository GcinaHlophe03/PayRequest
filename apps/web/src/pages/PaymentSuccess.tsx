import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { completeFakePayment } from "../api";

export default function PaymentSuccess() {
  const [params] = useSearchParams();

  const paymentId = params.get("paymentId");

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
    if (!paymentId) {
      setError("Missing payment ID.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      await completeFakePayment(paymentId);

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (success) {
    return (
      <div className="center-page">
        <div className="payment-card success-card">
          <div className="success-icon">✓</div>

          <p className="eyebrow">PAYMENT COMPLETE</p>

          <h1>Payment successful</h1>

          <p>
            Your payment has been successfully processed.
          </p>

          <Link to="/" className="primary-button">
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page">
      <div className="payment-card">
        <p className="test-label">
          FAKE PAYMENT PROVIDER
        </p>

        <p className="eyebrow">CHECKOUT</p>

        <h1>Complete payment</h1>

        <div className="fake-card">
          <div className="fake-card-number">
            4242 4242 4242 4242
          </div>

          <div className="fake-card-bottom">
            <span>12/29</span>
            <span>123</span>
          </div>
        </div>

        <p className="test-info">
          This is a development payment environment.
          No real money will be transferred.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          className="primary-button full-width"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing
            ? "Processing..."
            : "Pay with test card"}
        </button>
      </div>
    </div>
  );
}