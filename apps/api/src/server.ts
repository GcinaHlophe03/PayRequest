import "dotenv/config";

import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import paymentRequestsRouter from "./routes/paymentRequests";
import publicPaymentsRouter from "./routes/publicPayments";
import { fakePaymentRouter } from "./routes/fakePayments";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(clerkMiddleware());

app.get("/", (_req, res) => {
  res.json({
    message: "PayRequest API is running",
  });
});

app.use(
  "/payment-requests",
  paymentRequestsRouter
);

app.use(
  "/public",
  publicPaymentsRouter
);

app.use(
  "/fake-payments",
  fakePaymentRouter
);

const PORT = 4000;

app.listen(PORT, () => {
  console.log(
    `🚀 PayRequest API running on http://localhost:${PORT}`
  );
});