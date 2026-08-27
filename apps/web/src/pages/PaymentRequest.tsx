import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "./PaymentRequest.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

interface PaymentRequestData {
  id: string;
  senderName: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  expiresAt: string | null;
}

export default function PaymentRequest() {
  const { token } = useParams<{ token: string }>();

  const [payment, setPayment] =
    useState<PaymentRequestData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [processing, setProcessing] =
    useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadPayment = async () => {
      try {
        const response = await fetch(
          `${API_URL}/public/payment/${token}`
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!response.ok) {
          const text = await response.text();

          throw new Error(
            `Payment request could not be loaded (${response.status}). ${
              text || ""
            }`
          );
        }

        if (!contentType.includes("application/json")) {
          const text = await response.text();

          console.error(
            "Expected JSON but received:",
            text
          );

          throw new Error(
            "The API returned an invalid response."
          );
        }

        const data: PaymentRequestData =
          await response.json();

        if (!cancelled) {
          setPayment(data);
        }
      } catch (err) {
        console.error(
          "Failed to load payment:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment request."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPayment();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCheckout = async () => {
    if (!token) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/public/payment/${token}/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text ||
            `Checkout failed (${response.status})`
        );
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The API returned an invalid checkout response."
        );
      }

      const data: {
        paymentId: string;
        checkoutUrl: string;
      } = await response.json();

      /*
       * Redirect the customer to checkout.
       *
       * At the moment this is your fake checkout URL.
       * Later this will be the real payment provider URL.
       */
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error(
        "Checkout failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to start checkout."
      );

      setProcessing(false);
    }
  };

  const formatCurrency = (
    amount: number,
    currency: string
  ) => {
    return new Intl.NumberFormat(
      "en-ZA",
      {
        style: "currency",
        currency,
      }
    ).format(amount);
  };

  /*
   * No token.
   *
   * We don't set state from the effect.
   * We simply render the error directly.
   */
  if (!token) {
    return (
      <div className="payment-page">
        <div className="payment-card error-card">
          <div className="payment-error-icon">
            !
          </div>

          <h1>
            Invalid payment link
          </h1>

          <p>
            This payment link is missing a
            valid payment token.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <div className="payment-spinner" />

          <h2>
            Loading payment request...
          </h2>

          <p>
            Please wait while we retrieve
            the payment details.
          </p>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="payment-page">
        <div className="payment-card error-card">
          <div className="payment-error-icon">
            !
          </div>

          <h1>
            Payment unavailable
          </h1>

          <p>
            {error}
          </p>

          <button
            className="secondary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="payment-page">
        <div className="payment-card error-card">
          <div className="payment-error-icon">
            !
          </div>

          <h1>
            Payment unavailable
          </h1>

          <p>
            This payment request could not
            be found.
          </p>
        </div>
      </div>
    );
  }

  if (payment.status === "PAID") {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <div className="success-icon">
            ✓
          </div>

          <h1>
            Payment already completed
          </h1>

          <p>
            This payment request has
            already been paid.
          </p>
        </div>
      </div>
    );
  }

  if (payment.status === "EXPIRED") {
    return (
      <div className="payment-page">
        <div className="payment-card error-card">
          <div className="payment-error-icon">
            !
          </div>

          <h1>
            Payment request expired
          </h1>

          <p>
            This payment request is no
            longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-card">

        {/* BRAND */}

        <div className="payment-brand">
          <div className="brand-mark">
            P
          </div>

          <span>
            PayRequest
          </span>
        </div>

        <div className="payment-divider" />

        {/* HEADER */}

        <p className="payment-label">
          PAYMENT REQUEST
        </p>

        <h1>
          {payment.senderName}
          {" "}is requesting payment
        </h1>

        {/* AMOUNT */}

        <div className="amount-display">
          {formatCurrency(
            Number(payment.amount),
            payment.currency
          )}
        </div>

        {/* DESCRIPTION */}

        {payment.description && (
          <div className="description-box">
            <span>
              Description
            </span>

            <strong>
              {payment.description}
            </strong>
          </div>
        )}

        {/* EXPIRY */}

        {payment.expiresAt && (
          <p className="expiry">
            Expires{" "}
            {new Date(
              payment.expiresAt
            ).toLocaleString("en-ZA")}
          </p>
        )}

        {/* CHECKOUT ERROR */}

        {error && (
          <div className="inline-error">
            {error}
          </div>
        )}

        {/* PAY BUTTON */}

        <button
          className="pay-button"
          onClick={handleCheckout}
          disabled={processing}
        >
          {processing
            ? "Starting checkout..."
            : `Pay ${formatCurrency(
                Number(payment.amount),
                payment.currency
              )}`}
        </button>

        {/* SECURITY */}

        <p className="secure-text">
          🔒 Secure payment powered by
          PayRequest
        </p>
      </div>
    </div>
  );
}