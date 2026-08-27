const API_URL = "http://localhost:4000";

export interface PaymentRequest {
  id: string;
  senderName?: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  expiresAt?: string | null;
  createdAt?: string;
  paymentUrl?: string;
}

export async function createPaymentRequest(data: {
  amount: number;
  currency: string;
  description: string;
  recipientName: string;
  recipientEmail: string;
}) {
  const response = await fetch(`${API_URL}/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create payment request");
  }

  return response.json();
}

export async function getPublicPayment(token: string) {
  const response = await fetch(`${API_URL}/public/payment/${token}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Unable to load payment request");
  }

  return response.json();
}

export async function createCheckout(token: string) {
  const response = await fetch(
    `${API_URL}/public/payment/${token}/checkout`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Unable to create checkout");
  }

  return response.json();
}

export async function completeFakePayment(paymentId: string) {
  const response = await fetch(
    `${API_URL}/fake-payments/${paymentId}/succeed`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Payment failed");
  }

  return response.json();
}