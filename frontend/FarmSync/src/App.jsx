import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Crops from "./pages/Crops";
import Marketplace from "./pages/Marketplace";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import PageNotFound from "./pages/PageNotFound";
import AppLayout from "./ui/AppLayout";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {Toaster} from "react-hot-toast";
import {getCurrentUser, getToken, isBuyer, isSeller} from "./services/authApi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 60 * 1000, - 1 min
      staleTime: 0,
    },
  },
});

function ProtectedRoute() {
  if (!getToken()) return <Navigate replace to="/login" />;
  return <AppLayout />;
}

function HomeRedirect() {
  const user = getCurrentUser();
  return <Navigate replace to={user?.role === "seller" ? "/crops" : "/marketplace"} />;
}

function SellerRoute({children}) {
  if (!isSeller()) return <Navigate replace to="/marketplace" />;
  return children;
}

function BuyerRoute({children}) {
  if (!isBuyer()) return <Navigate replace to="/marketplace" />;
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<Auth />} />
          <Route path="register" element={<Auth />} />

          <Route element={<ProtectedRoute />}>
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route
              path="crops"
              element={
                <SellerRoute>
                  <Crops />
                </SellerRoute>
              }
            />
            <Route
              path="orders"
              element={
                <BuyerRoute>
                  <Orders />
                </BuyerRoute>
              }
            />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{margin: "8px"}}
        toastOptions={{
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
          style: {
            fontSize: "16px",
            maxWidth: "500px",
            padding: "16px 24px",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-secondary)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
