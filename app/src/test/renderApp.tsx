import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { App } from "@app/app.component";
import { AuthProvider } from "@core/auth/auth.store";

/** Renders the whole app at a given URL, the way the browser would. */
export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
