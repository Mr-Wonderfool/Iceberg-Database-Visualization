import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import MapVis from "./pages/MapVis";
import DashBoard from "./pages/DashBoard";
import LoginForm from "./pages/LoginForm";
import SignupForm from "./pages/SignUpForm";
import IcebergDetail from "./pages/IcebergDetail";
import UserProvider from "./components/UserProvider";

const AppRoutes = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapVis />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/iceberg/:iceberg_id" element={<IcebergDetail />} />
          <Route path="/dashboard" element={<DashBoard />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
};

export default AppRoutes;
