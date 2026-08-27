import { Router } from "express";

import {
  prisma,
  PaymentStatus,
  PaymentRequestStatus,
  AuditAction,
} from "@payrequest/database";

export const fakePaymentRouter =
  Router();

/**
 * POST /fake-payments/:paymentId/succeed
 *
 * Development-only fake payment success
 * endpoint.
 *
 * This simulates the customer successfully
 * completing a payment with the payment provider.
 */
fakePaymentRouter.post(
  "/:paymentId/succeed",
  async (req, res) => {
    try {
      const { paymentId } =
        req.params;

      if (!paymentId) {
        return res.status(400).json({
          error:
            "Payment ID is required",
        });
      }

      /*
       * Find the Payment using its actual
       * database ID.
       */
      const payment =
        await prisma.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

      if (!payment) {
        return res.status(404).json({
          error:
            "Payment not found",
        });
      }

      /*
       * If already successful, don't process
       * it again.
       */
      if (
        payment.status ===
        PaymentStatus.SUCCEEDED
      ) {
        return res.json({
          success: true,

          message:
            "Payment already processed",
        });
      }

      /*
       * Don't allow failed/cancelled/refunded
       * payments to magically succeed.
       */
      if (
        payment.status ===
          PaymentStatus.FAILED ||
        payment.status ===
          PaymentStatus.CANCELLED ||
        payment.status ===
          PaymentStatus.REFUNDED
      ) {
        return res.status(400).json({
          error:
            `Payment cannot be completed because its current status is ${payment.status}`,
        });
      }

      const now = new Date();

      /*
       * Update both the Payment and the
       * original PaymentRequest atomically.
       */
      await prisma.$transaction([
        /*
         * Payment
         */
        prisma.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status:
              PaymentStatus.SUCCEEDED,

            paidAt: now,

            providerPaymentId:
              payment.id,
          },
        }),

        /*
         * Payment Request
         */
        prisma.paymentRequest.update({
          where: {
            id:
              payment.paymentRequestId,
          },

          data: {
            status:
              PaymentRequestStatus.PAID,

            paidAt: now,
          },
        }),

        /*
         * Audit log
         */
        prisma.auditLog.create({
          data: {
            paymentRequestId:
              payment.paymentRequestId,

            action:
              AuditAction.PAYMENT_SUCCEEDED,

            metadata: {
              paymentId:
                payment.id,

              provider:
                "FAKE",
            },
          },
        }),
      ]);

      return res.json({
        success: true,

        message:
          "Fake payment completed successfully",

        paymentId:
          payment.id,
      });
    } catch (error) {
      console.error(
        "Failed to complete fake payment:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to complete payment",
      });
    }
  }
);