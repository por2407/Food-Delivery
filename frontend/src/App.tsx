import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import MenuPage from "./pages/MenuPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import RestaurantAdminPage from "./pages/RestaurantAdminPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";
import RiderReviewsPage from "./pages/RiderReviewsPage";
import { useAuthStore } from "./store/useAuthStore";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/restaurant/:id",
    element: <MenuPage />,
  },
  {
    path: "/checkout",
    element: <CheckoutPage />,
  },
  {
    path: "/orders",
    element: <OrdersPage />,
  },
  {
    path: "/restaurant-admin",
    element: <RestaurantAdminPage />,
  },
  {
    path: "/rider",
    element: <RiderDashboardPage />,
  },
  {
    path: "/rider-reviews",
    element: <RiderReviewsPage />,
  },
]);



export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <RouterProvider router={router} />;
}
