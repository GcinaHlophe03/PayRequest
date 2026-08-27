import { Router, Response } from "express";
import crypto from "crypto";

import { prisma } from "@payrequest/database";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

const WEB_URL = process.env.WEB_URL || "http://localhost:5173";

/**
 * GET /payment-requests
 *
 * Returns all payment requests belonging to
 * the currently authenticated user.
 */
router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const requests = await prisma.paymentRequest.findMany({
        where: {
          senderId: req.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          payments: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      const formattedRequests = requests.map((request) => ({
        id: request.id,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        status: request.status,
        expiresAt: request.expiresAt,
        createdAt: request.createdAt,
        recipientName: request.recipientName,
        recipientEmail: request.recipientEmail,
        paymentUrl: `${WEB_URL}/pay/${request.publicToken}`,
        payments: request.payments,
      }));

      return res.json(formattedRequests);
    } catch (error) {
      console.error(
        "Failed to fetch payment requests:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch payment requests",
      });
    }
  }
);

/**
 * POST /payment-requests
 *
 * Creates a new payment request for the
 * currently authenticated user.
 */
router.post(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      const {
        amount,
        currency = "ZAR",
        description,
        recipientName,
        recipientEmail,
        expiresAt,
      } = req.body;

      const numericAmount = Number(amount);

      if (
        !amount ||
        Number.isNaN(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          error: "Amount must be greater than 0",
        });
      }

      if (!currency) {
        return res.status(400).json({
          error: "Currency is required",
        });
      }

      const publicToken = crypto
        .randomBytes(32)
        .toString("hex");

      const paymentRequest =
        await prisma.paymentRequest.create({
          data: {
            senderId: req.userId,
            amount: numericAmount,
            currency,
            description:
              description?.trim() || null,
            recipientName:
              recipientName?.trim() || null,
            recipientEmail:
              recipientEmail?.trim() || null,
            publicToken,
            status: "PENDING",
            expiresAt: expiresAt
              ? new Date(expiresAt)
              : null,
          },
        });

      const paymentUrl = `${WEB_URL}/pay/${paymentRequest.publicToken}`;

      return res.status(201).json({
        id: paymentRequest.id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        status: paymentRequest.status,
        expiresAt: paymentRequest.expiresAt,
        createdAt: paymentRequest.createdAt,
        recipientName:
          paymentRequest.recipientName,
        recipientEmail:
          paymentRequest.recipientEmail,
        paymentUrl,
      });
    } catch (error) {
      console.error(
        "Failed to create payment request:",
        error
      );

      return res.status(500).json({
        error: "Failed to create payment request",
      });
    }
  }
);

export default router;