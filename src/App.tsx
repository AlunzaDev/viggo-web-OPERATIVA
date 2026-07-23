import { Toaster } from "react-hot-toast";
import { AppRouter } from "./presentation/router/AppRouter";
import { AuthProvider } from "./presentation/context/auth/AuthProvider";
import { AppErrorBoundary } from "./presentation/components/errors/AppErrorBoundary";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </AuthProvider>
    </>
  );
}
