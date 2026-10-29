import { Navigate, Route, Routes } from "react-router";
import { AdminPage } from "../pages/AdminPage";
import { HomePage } from "../pages/HomePage";
import { RequestAccessPage } from "../pages/RequestAccessPage";
import { RoomPage } from "../pages/RoomPage";
import { RouteGuard } from "./route-guard";

/**
 *  /                 home + Google sign-in (signed-in people are sent on)
 *  /request-access   signed in, not a member yet
 *  /room             members
 *  /admin            admins
 */
export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteGuard rule="signed-out">
            <HomePage />
          </RouteGuard>
        }
      />
      <Route
        path="/request-access"
        element={
          <RouteGuard rule="non-member">
            <RequestAccessPage />
          </RouteGuard>
        }
      />
      <Route
        path="/room"
        element={
          <RouteGuard rule="member">
            <RoomPage />
          </RouteGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <RouteGuard rule="admin">
            <AdminPage />
          </RouteGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
