import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPaymentRequest } from "../api";

export default function CreateRequest() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (!description.trim()) {
      setError("Enter a description.");
      return;
    }

    if (!recipientEmail.trim()) {
      setError("Enter the recipient's email.");
      return;
    }

    try {
      setLoading(true);

      const request = await createPaymentRequest({
        amount: numericAmount,
        currency: "ZAR",
        description,
        recipientName,
        recipientEmail,
      });

      if (request.paymentUrl) {
        const token = request.paymentUrl.split("/pay/")[1];

        navigate(`/pay/${token}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="logo">
          Pay<span>Request</span>
        </Link>
      </header>

      <main className="form-page">
        <div className="form-container">
          <Link to="/" className="back-link">
            ← Back
          </Link>

          <p className="eyebrow">NEW REQUEST</p>

          <h1>Request a payment</h1>

          <p className="form-description">
            Enter the details below and we'll generate a secure
            payment link.
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              Amount
              <div className="amount-input">
                <span>R</span>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </label>

            <label>
              Description

              <input
                type="text"
                placeholder="e.g. Dinner"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label>
              Recipient name

              <input
                type="text"
                placeholder="John Smith"
                value={recipientName}
                onChange={(e) =>
                  setRecipientName(e.target.value)
                }
              />
            </label>

            <label>
              Recipient email

              <input
                type="email"
                placeholder="john@example.com"
                value={recipientEmail}
                onChange={(e) =>
                  setRecipientEmail(e.target.value)
                }
              />
            </label>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading
                ? "Creating request..."
                : "Create Payment Request"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}