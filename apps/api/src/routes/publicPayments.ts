import { Router, Response } from "express";
import crypto from "crypto";

import {
  prisma,
  PaymentStatus,
} from "@payrequest/database";

const router = Router();

const WEB_URL =
  process.env.WEB_URL || "http://localhost:5173";

/**
 * GET /public/payment/:token
 *
 * Returns public information about a payment request.
 *
 * This endpoint does NOT require authentication.
 */
router.get(
  "/payment/:token",
  async (req, res: Response) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          error: "Payment token is required",
        });
      }

      const paymentRequest =
        await prisma.paymentRequest.findUnique({
          where: {
            publicToken: token,
          },

          include: {
            sender: true,
          },
        });

      if (!paymentRequest) {
        return res.status(404).json({
          error: "Payment request not found",
        });
      }

      /*
       * Already paid
       */
      if (paymentRequest.status === "PAID") {
        return res.status(410).json({
          error:
            "This payment request has already been paid",
        });
      }

      /*
       * Check expiration
       */
      if (
        paymentRequest.expiresAt &&
        new Date(paymentRequest.expiresAt) <
          new Date()
      ) {
        return res.status(410).json({
          error:
            "This payment request has expired",
        });
      }

      /*
       * When someone opens a pending request,
       * mark it as OPENED.
       */
      if (
        paymentRequest.status ===
        "PENDING"
      ) {
        await prisma.paymentRequest.update({
          where: {
            id: paymentRequest.id,
          },

          data: {
            status: "OPENED",
          },
        });
      }

      return res.json({
        id: paymentRequest.id,

        senderName:
          paymentRequest.sender?.fullName ||
          "PayRequest User",

        amount: paymentRequest.amount,

        currency:
          paymentRequest.currency,

        description:
          paymentRequest.description,

        status:
          paymentRequest.status ===
          "PENDING"
            ? "OPENED"
            : paymentRequest.status,

        expiresAt:
          paymentRequest.expiresAt,

        recipientName:
          paymentRequest.recipientName,

        recipientEmail:
          paymentRequest.recipientEmail,
      });
    } catch (error) {
      console.error(
        "Failed to load public payment:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load payment request",
      });
    }
  }
);

/**
 * POST /public/payment/:token/checkout
 *
 * Creates a payment record and returns
 * the fake checkout URL.
 *
 * This is the development payment flow.
 */
router.post(
  "/payment/:token/checkout",
  async (req, res: Response) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          error: "Payment token is required",
        });
      }

      /*
       * Find the payment request.
       */
      const paymentRequest =
        await prisma.paymentRequest.findUnique({
          where: {
            publicToken: token,
          },
        });

      if (!paymentRequest) {
        return res.status(404).json({
          error:
            "Payment request not found",
        });
      }

      /*
       * Do not allow payment after it
       * has already been completed.
       */
      if (
        paymentRequest.status ===
        "PAID"
      ) {
        return res.status(410).json({
          error:
            "This payment request has already been paid",
        });
      }

      /*
       * Check expiration.
       */
      if (
        paymentRequest.expiresAt &&
        new Date(paymentRequest.expiresAt) <
          new Date()
      ) {
        return res.status(410).json({
          error:
            "This payment request has expired",
        });
      }

      /*
       * Look for an existing unfinished
       * payment for this request.
       *
       * This prevents multiple Payment
       * records from being created if the
       * customer clicks Pay repeatedly.
       */
      const existingPayment =
        await prisma.payment.findFirst({
          where: {
            paymentRequestId:
              paymentRequest.id,

            status: {
              in: [
                PaymentStatus.CREATED,
                PaymentStatus.PROCESSING,
              ],
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      /*
       * Re-use existing payment if one exists.
       *
       * Otherwise create a new payment.
       */
      const payment =
        existingPayment ??
        (await prisma.payment.create({
          data: {
            paymentRequestId:
              paymentRequest.id,

            amount:
              paymentRequest.amount,

            currency:
              paymentRequest.currency,

            status:
              PaymentStatus.CREATED,

            provider: "FAKE",

            providerReference:
              crypto
                .randomBytes(16)
                .toString("hex"),
          },
        }));

      /*
       * Fake checkout page.
       */
      const checkoutUrl =
        `${WEB_URL}/checkout/fake` +
        `?paymentId=${payment.id}` +
        `&requestId=${paymentRequest.id}`;

      return res.json({
        paymentId: payment.id,

        checkoutUrl,
      });
    } catch (error) {
      console.error(
        "Failed to create checkout:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to create checkout",
      });
    }
  }
);

export default router;