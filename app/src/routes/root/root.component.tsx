import { isHandheld } from "@services/media-devices-service/utils/is-handheld.util";
import { PhoneNoticePage } from "@features/phone-notice/index";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "@shared/stores/auth-store/auth.store";
import { AppRoutes } from "../app-routes/app-routes.component";

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
