export type PaymentRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "OPENED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "CREATED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface CreatePaymentRequestInput {
  amount: number;
  currency?: string;
  description?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  expiresAt?: string;
}

export interface PaymentRequestResponse {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: PaymentRequestStatus;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  expiresAt: string | null;
  createdAt: string;
  paymentUrl?: string;
}

export interface PublicPaymentRequest {
  id: string;
  senderName: string | null;
  amount: number;
  currency: string;
  description: string | null;
  status: PaymentRequestStatus;
  expiresAt: string | null;
}

export interface CheckoutResponse {
  paymentId: string;
  checkoutUrl: string;
}

export interface PaymentResponse {
  id: string;
  paymentRequestId: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
}