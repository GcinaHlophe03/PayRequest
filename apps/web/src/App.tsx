import {
  SignIn,
  SignUp,
} from "@clerk/react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import PaymentRequest from "./pages/PaymentRequest";

import "./styles.css";

function AuthPage() {
  const location = useLocation();

  const isSignUp =
    location.pathname === "/sign-up";

  return (
    <div className="auth-page">
      {isSignUp ? (
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      ) : (
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      )}
    </div>
  );
}

function ProtectedDashboard() {
  return (
    <>
<SignIn>
        <Dashboard />
      </SignIn>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing / authentication */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/sign-in/*"
          element={<AuthPage />}
        />

        <Route
          path="/sign-up/*"
          element={<AuthPage />}
        />

        {/* Protected merchant dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedDashboard />
          }
        />

        {/* Public payment link */}

        <Route
          path="/pay/:token"
          element={
            <PaymentRequest />
          }
        />

        {/* Fallback */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}