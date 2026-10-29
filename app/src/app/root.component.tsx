import { isHandheld } from "@core/devices/is-handheld.util";
import { PhoneNoticePage } from "@features/phone-notice";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "@core/auth/auth.store";
import { App } from "./app.component";

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
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}
