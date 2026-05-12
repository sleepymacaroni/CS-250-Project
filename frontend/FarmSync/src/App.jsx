import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Crops from "./pages/Crops";
import Marketplace from "./pages/Marketplace";
import Orders from "./pages/Orders";
import PageNotFound from "./pages/PageNotFound";
import AppLayout from "./ui/AppLayout";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {Toaster} from "react-hot-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 60 * 1000, - 1 min
      staleTime: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="crops" element={<Crops />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="orders" element={<Orders />} />
          </Route>

          {/* FUTURE LOGIN ROUTE WITH PAGENOTFOUND */}
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
