import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "@routes/app-routes/app-routes.component";
import { AuthProvider } from "@shared/stores/auth-store/auth.store";

/** Renders the whole app at a given URL, the way the browser would. */
export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}
