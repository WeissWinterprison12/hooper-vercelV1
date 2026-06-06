import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

import {
  BuyerRoute,
  SellerRoute,
  default as AuthRedirect
} from "./ProtectedRoute";

// Pages
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Privacy from "./Pages/Privacy";
import Terms from "./Pages/Terms";
import Pr from "./Pages/Pr";
import Contact from "./Pages/contact";

import BuyerHome from "./Pages/Buyer_home";
import BuyerShop from "./Pages/Buyer_shop";
import BuyerDashboard from "./Pages/Buyer_dashboard";
import BuyerOrders from "./Pages/buyer_orders";
import BuyerMessages from "./Pages/buyer_messages";
import Checkout from "./Pages/checkout";

import SellerDashboard from "./Pages/seller_dashboard";
import SellerProduct from "./Pages/seller_product";
import SellerSettings from "./Pages/seller_settings";
import SellerOrders from "./Pages/seller_orders";
import SellerMessages from "./Pages/seller_messages";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/Pr" element={<Pr />} />
          <Route path="/contact" element={<Contact />} />

          {/* BUYER */}
          <Route
            path="/buyer_home"
            element={
              <BuyerRoute>
                <BuyerHome />
              </BuyerRoute>
            }
          />

          <Route
            path="/buyer_shop"
            element={
              <BuyerRoute>
                <BuyerShop />
              </BuyerRoute>
            }
          />

          <Route
            path="/buyer_dashboard"
            element={
              <BuyerRoute>
                <BuyerDashboard />
              </BuyerRoute>
            }
          />

          <Route
            path="/buyer_orders"
            element={
              <BuyerRoute>
                <BuyerOrders />
              </BuyerRoute>
            }
          />

          <Route
            path="/buyer_messages"
            element={
              <BuyerRoute>
                <BuyerMessages />
              </BuyerRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <BuyerRoute>
                <Checkout />
              </BuyerRoute>
            }
          />

          {/* SELLER */}
          <Route
            path="/seller_dashboard"
            element={
              <SellerRoute>
                <SellerDashboard />
              </SellerRoute>
            }
          />

          <Route
            path="/seller_product"
            element={
              <SellerRoute>
                <SellerProduct />
              </SellerRoute>
            }
          />

          <Route
            path="/seller_settings"
            element={
              <SellerRoute>
                <SellerSettings />
              </SellerRoute>
            }
          />

          <Route
            path="/seller_orders"
            element={
              <SellerRoute>
                <SellerOrders />
              </SellerRoute>
            }
          />

          <Route
            path="/seller_messages"
            element={
              <SellerRoute>
                <SellerMessages />
              </SellerRoute>
            }
          />

          {/* ROOT */}
          <Route path="/" element={<AuthRedirect />} />
          <Route path="*" element={<AuthRedirect />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;