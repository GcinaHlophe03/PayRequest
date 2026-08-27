import crypto from "crypto";

import {
  PaymentProvider,
  CreateCheckoutInput,
  CheckoutSession,
  PaymentStatusResult,
} from "./types";

export class FakePaymentProvider
  implements PaymentProvider
{
  private payments = new Map<
    string,
    PaymentStatusResult
  >();

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CheckoutSession> {
    const paymentId = crypto.randomUUID();

    this.payments.set(paymentId, {
      paymentId,
      status: "CREATED",
    });

    return {
      paymentId,
      provider: "FAKE",
      checkoutUrl:
        `${process.env.WEB_URL}/checkout/fake` +
        `?paymentId=${paymentId}` +
        `&requestId=${input.paymentRequestId}`,
    };
  }

  async getPaymentStatus(
    paymentId: string
  ): Promise<PaymentStatusResult> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  }

  async markSucceeded(paymentId: string) {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.status = "SUCCEEDED";

    this.payments.set(paymentId, payment);

    return payment;
  }

  async markFailed(paymentId: string) {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.status = "FAILED";

    this.payments.set(paymentId, payment);

    return payment;
  }
}