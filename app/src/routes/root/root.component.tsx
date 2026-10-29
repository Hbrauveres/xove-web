import { isHandheld } from "@services/media-devices-service";
import { PhoneNoticePage } from "@features/phone-notice";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "@shared/stores/auth-store";
import { AppRoutes } from "../app-routes";

/**
 * What the page shows, decided once as it loads: a phone or a tablet gets only the screen that
 * says Xovê is for a laptop or a desktop (nothing else loads: no sign-in, no API, no LiveKit);
 * a computer gets the app.
 */
export function Root() {
  if (isHandheld()) return <PhoneNoticePage />;
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
