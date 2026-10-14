import { Toaster } from "react-hot-toast";
import { AppRouter } from "./presentation/router/AppRouter";
import { AuthProvider } from "./presentation/context/auth/AuthProvider";
import { AppErrorBoundary } from "./presentation/components/errors/AppErrorBoundary";
import { InstallationGate } from "./presentation/components/installation/InstallationGate";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <AppErrorBoundary>
          {/* Linking comes before the login: users are only available once linked. */}
          <InstallationGate>
            <AppRouter />
          </InstallationGate>
        </AppErrorBoundary>
      </AuthProvider>
    </>
  );
}
