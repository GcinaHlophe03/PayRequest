import { useCallback, useEffect, useState } from "react";
import {
  useAuth,
  useUser,
  UserButton,
} from "@clerk/react";

import { apiFetch } from "../lib/api";

import "./Dashboard.css";

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PaymentRequest {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  recipientName: string | null;
  recipientEmail: string | null;
  paymentUrl: string;
  payments?: Payment[];
}

interface NewRequestForm {
  amount: string;
  description: string;
  recipientName: string;
  recipientEmail: string;
}

const initialForm: NewRequestForm = {
  amount: "",
  description: "",
  recipientName: "",
  recipientEmail: "",
};

function formatCurrency(
  amount: number,
  currency: string
) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [paymentRequests, setPaymentRequests] =
    useState<PaymentRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [creatingRequest, setCreatingRequest] =
    useState(false);

  const [newRequest, setNewRequest] =
    useState<NewRequestForm>(initialForm);

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  /*
   * LOAD PAYMENT REQUESTS
   *
   * This function is used by:
   * - initial page load
   * - Refresh button
   * - Try Again button
   */
  const loadPaymentRequests = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        if (!token) {
          throw new Error(
            "You are not authenticated. Please sign in again."
          );
        }

        const data = await apiFetch(
          "/payment-requests",
          token
        );

        if (!Array.isArray(data)) {
          throw new Error(
            "The API returned an invalid payment request list."
          );
        }

        setPaymentRequests(data);
      } catch (error) {
        console.error(
          "Failed to load payment requests:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load payment requests"
        );
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  /*
   * INITIAL LOAD
   *
   * We intentionally don't call setState directly
   * from the effect body.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) {
        return;
      }

      await loadPaymentRequests();
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadPaymentRequests]);

  /*
   * CREATE PAYMENT REQUEST
   */
  const createPaymentRequest = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setCreatingRequest(true);

      const token = await getToken();

      if (!token) {
        throw new Error(
          "You are not authenticated."
        );
      }

      const amount = Number(
        newRequest.amount
      );

      if (
        Number.isNaN(amount) ||
        amount <= 0
      ) {
        throw new Error(
          "Please enter a valid amount."
        );
      }

      const createdRequest =
        await apiFetch(
          "/payment-requests",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              amount,
              currency: "ZAR",
              description:
                newRequest.description ||
                null,
              recipientName:
                newRequest.recipientName ||
                null,
              recipientEmail:
                newRequest.recipientEmail ||
                null,
            }),
          }
        );

      setPaymentRequests(
        (currentRequests) => [
          createdRequest,
          ...currentRequests,
        ]
      );

      setShowCreateModal(false);

      setNewRequest(initialForm);

      alert(
        `Payment request created successfully!\n\nPayment link:\n${createdRequest.paymentUrl}`
      );
    } catch (error) {
      console.error(
        "Failed to create payment request:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create payment request"
      );
    } finally {
      setCreatingRequest(false);
    }
  };

  /*
   * COPY PAYMENT LINK
   */
  const copyPaymentLink = async (
    request: PaymentRequest
  ) => {
    try {
      await navigator.clipboard.writeText(
        request.paymentUrl
      );

      setCopiedId(request.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy payment link:",
        error
      );

      alert(
        "Unable to copy the payment link."
      );
    }
  };

  /*
   * STATISTICS
   */
  const totalRequested =
    paymentRequests.reduce(
      (total, request) =>
        total + Number(request.amount),
      0
    );

  const totalPaid =
    paymentRequests
      .filter(
        (request) =>
          request.status === "PAID"
      )
      .reduce(
        (total, request) =>
          total + Number(request.amount),
        0
      );

  const pendingRequests =
    paymentRequests.filter(
      (request) =>
        request.status === "PENDING" ||
        request.status === "OPENED"
    ).length;

  const firstName =
    user?.firstName ||
    user?.username ||
    "there";

  return (
    <div className="dashboard">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            P
          </div>

          <span>PayRequest</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            type="button"
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            type="button"
          >
            <span>↗</span>
            Payment Requests
          </button>

          <button
            className="nav-item"
            type="button"
          >
            <span>◷</span>
            Payment History
          </button>

          <button
            className="nav-item"
            type="button"
          >
            <span>⚙</span>
            Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {firstName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.fullName ||
                  firstName}
              </strong>

              <span>
                {user
                  ?.primaryEmailAddress
                  ?.emailAddress || ""}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">
              OVERVIEW
            </p>

            <h1>
              Welcome back, {firstName}
            </h1>

            <p className="header-description">
              Create and manage your payment
              requests.
            </p>
          </div>

          <div className="header-actions">
            <button
              className="new-request-button"
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
            >
              <span>+</span>
              New Request
            </button>

            <UserButton />
          </div>
        </header>

        {/* ERROR */}

        {error && (
          <div className="error-banner">
            <div>
              <strong>
                Unable to load payment requests
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadPaymentRequests()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* STATS */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              R
            </div>

            <div>
              <span className="stat-label">
                Total Requested
              </span>

              <strong className="stat-value">
                {formatCurrency(
                  totalRequested,
                  "ZAR"
                )}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ✓
            </div>

            <div>
              <span className="stat-label">
                Total Received
              </span>

              <strong className="stat-value">
                {formatCurrency(
                  totalPaid,
                  "ZAR"
                )}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              ◷
            </div>

            <div>
              <span className="stat-label">
                Pending Requests
              </span>

              <strong className="stat-value">
                {pendingRequests}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              #
            </div>

            <div>
              <span className="stat-label">
                Total Requests
              </span>

              <strong className="stat-value">
                {paymentRequests.length}
              </strong>
            </div>
          </div>
        </section>

        {/* PAYMENT REQUESTS */}

        <section className="requests-section">
          <div className="section-header">
            <div>
              <h2>
                Recent Payment Requests
              </h2>

              <p>
                Your latest payment requests
                and their current status.
              </p>
            </div>

            <button
              className="refresh-button"
              type="button"
              onClick={() =>
                void loadPaymentRequests()
              }
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          <div className="requests-card">
            {loading ? (
              <div className="empty-state">
                <div className="spinner" />

                <h3>
                  Loading payment requests...
                </h3>
              </div>
            ) : paymentRequests.length ===
              0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  R
                </div>

                <h3>
                  No payment requests yet
                </h3>

                <p>
                  Create your first payment
                  request and send the link
                  to someone.
                </p>

                <button
                  className="new-request-button"
                  type="button"
                  onClick={() =>
                    setShowCreateModal(true)
                  }
                >
                  + Create Your First Request
                </button>
              </div>
            ) : (
              <div className="requests-table-wrapper">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Link</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paymentRequests.map(
                      (request) => (
                        <tr key={request.id}>
                          <td>
                            <div className="recipient">
                              <div className="recipient-avatar">
                                {(
                                  request.recipientName ||
                                  "?"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {request.recipientName ||
                                    "Anyone"}
                                </strong>

                                {request.recipientEmail && (
                                  <span>
                                    {
                                      request.recipientEmail
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            {request.description ||
                              "No description"}
                          </td>

                          <td className="amount-cell">
                            {formatCurrency(
                              Number(
                                request.amount
                              ),
                              request.currency
                            )}
                          </td>

                          <td>
                            <span
                              className={`status status-${request.status.toLowerCase()}`}
                            >
                              {request.status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              request.createdAt
                            )}
                          </td>

                          <td>
                            <button
                              className="copy-button"
                              type="button"
                              onClick={() =>
                                void copyPaymentLink(
                                  request
                                )
                              }
                            >
                              {copiedId ===
                              request.id
                                ? "Copied!"
                                : "Copy Link"}
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* CREATE PAYMENT REQUEST MODAL */}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">
                  NEW PAYMENT REQUEST
                </p>

                <h2>
                  Request a payment
                </h2>

                <p>
                  Create a secure payment link
                  and send it to anyone.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                createPaymentRequest
              }
            >
              <div className="form-group">
                <label>
                  Amount
                </label>

                <div className="amount-input">
                  <span>R</span>

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={
                      newRequest.amount
                    }
                    onChange={(event) =>
                      setNewRequest({
                        ...newRequest,
                        amount:
                          event.target.value,
                      })
                    }
                    placeholder="500.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Description
                </label>

                <input
                  type="text"
                  value={
                    newRequest.description
                  }
                  onChange={(event) =>
                    setNewRequest({
                      ...newRequest,
                      description:
                        event.target.value,
                    })
                  }
                  placeholder="What is this payment for?"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Recipient Name
                  </label>

                  <input
                    type="text"
                    value={
                      newRequest.recipientName
                    }
                    onChange={(event) =>
                      setNewRequest({
                        ...newRequest,
                        recipientName:
                          event.target.value,
                      })
                    }
                    placeholder="John Smith"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Recipient Email
                  </label>

                  <input
                    type="email"
                    value={
                      newRequest.recipientEmail
                    }
                    onChange={(event) =>
                      setNewRequest({
                        ...newRequest,
                        recipientEmail:
                          event.target.value,
                      })
                    }
                    placeholder="john@email.com"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  disabled={
                    creatingRequest
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-button"
                  disabled={
                    creatingRequest
                  }
                >
                  {creatingRequest
                    ? "Creating Request..."
                    : "Create Payment Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}