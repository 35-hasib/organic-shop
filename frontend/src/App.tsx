import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { GuestOrderConfirmation } from "./pages/GuestOrderConfirmation";
import { TrackOrder } from "./pages/TrackOrder";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AccountLayout } from "./pages/AccountLayout";
import { Profile } from "./pages/Profile";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";
import { Addresses } from "./pages/Addresses";
import { Notifications } from "./pages/Notifications";
import { Wishlist } from "./pages/Wishlist";
import { Contact } from "./pages/Contact";
import { InfoPage } from "./pages/InfoPage";
import { NotFound } from "./pages/NotFound";

function Account() {
  return (
    <ProtectedRoute>
      <AccountLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="category/:slug" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-confirmed/:id" element={<GuestOrderConfirmation />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="account" element={<Account />}>
            <Route index element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          <Route
            path="wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route path="about" element={<InfoPage kind="about" />} />
          <Route path="faq" element={<InfoPage kind="faq" />} />
          <Route path="returns" element={<InfoPage kind="returns" />} />
          <Route path="privacy" element={<InfoPage kind="privacy" />} />
          <Route path="terms" element={<InfoPage kind="terms" />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
