export type CreateCheckoutInput = {
  paymentRequestId: string;
  amount: number;
  currency: string;
  description?: string;
};

export type CheckoutSession = {
  paymentId: string;
  checkoutUrl: string;
  provider: string;
};

export type PaymentStatusResult = {
  paymentId: string;
  status:
    | "CREATED"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";
};

export interface PaymentProvider {
  createCheckout(
    input: CreateCheckoutInput
  ): Promise<CheckoutSession>;

  getPaymentStatus(
    paymentId: string
  ): Promise<PaymentStatusResult>;
}