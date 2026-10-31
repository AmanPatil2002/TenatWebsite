import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import Admin from "./Pages/Admin/Admin";
import Home from "./Pages/Client/Home";
import Layout from "./Mycomponent/Layout";
import ViewUser from "./Mycomponent/ViewUser";
import ViewReview from "./Mycomponent/ViewReview";
import Myaccount from "./Pages/Client/Myaccount";
import Contact from "./Pages/Client/Contact";
import MySite from "./Pages/Client/MySite";

import Review from "./Pages/Client/Review";
import AdminDashboard from "./Mycomponent/AdminDashboard";
import AddTemplate from "./Mycomponent/AddTemplate";
import AddCategory from "./Mycomponent/AddCategory";
import Payment from "./Mycomponent/Payment";
import Template from "./Pages/Client/Template";
import ViewPayment from "./Mycomponent/ViewPayment";
import AddContact from "./Mycomponent/AddContact";
import AddFaq from "./Mycomponent/AddFaq";
import ViewTemplate from "./Mycomponent/ViewTemplate";
import MySiteView from "./Mycomponent/MySiteView";
import AddTheme from "./Mycomponent/AddTheme";
import AddPages from "./Mycomponent/AddPages";
import SiteAdminAccess from "./Mycomponent/SiteAdminAccess";
import SiteAdminLogin from "./Pages/Client/SiteAdminLogin";
import SiteAdminLayout from "./Mycomponent/SiteAdminLayout";
import SiteAdminDashboard from "./Mycomponent/SiteAdminDashboard";
import SiteAdminManagePages from "./Mycomponent/SiteAdminManagePages";
import SiteAdminEmployees from "./Mycomponent/SiteAdminEmployees";
import ArrangeTemplatePages from "./Mycomponent/ArrangeTemplatePages";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Site admin (client's own admin area) */}
        <Route path="/site-admin/:siteId/login" element={<SiteAdminLogin />} />
        <Route path="/site-admin/:siteId/preview" element={<MySiteView />} />
        <Route path="/site-admin/:siteId" element={<SiteAdminLayout />}>
          <Route index element={<Navigate to="panel" replace />} />
          <Route path="panel" element={<SiteAdminDashboard />} />
          <Route path="manage" element={<SiteAdminManagePages />} />
          <Route path="employees" element={<SiteAdminEmployees />} />
        </Route>

        {/* Client */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/contact" element={<Contact />} />
            <Route path="/review" element={<Review />} />
            <Route path="/myaccount" element={<Myaccount />} />
            <Route path="/templates" element={<Template />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/mysite" element={<MySite />} />
            <Route path="/mysite/:siteSlug" element={<MySiteView />} />
            <Route path="/mysite/:siteSlug/preview" element={<MySiteView />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoutes role="admin" />}>
          <Route path="/admin" element={<Admin />}>
            <Route path="theme" element={<AddTheme />} />
            <Route path="page" element={<AddPages />} />
            <Route path="templates" element={<AddTemplate />} />
            <Route
              path="templates/:templateId/edit"
              element={<AddTemplate />}
            />
            <Route path="category" element={<AddCategory />} />
            <Route path="viewtemplates" element={<ViewTemplate />} />
            <Route path="template-pages" element={<ArrangeTemplatePages />} />
            <Route path="users" element={<ViewUser />} />
            <Route path="usereview" element={<ViewReview />} />
            <Route path="admindashboard" element={<AdminDashboard />} />
            <Route path="invoice" element={<ViewPayment />} />
            <Route path="site-admins" element={<SiteAdminAccess />} />
            <Route path="faq" element={<AddFaq />} />
            <Route path="contact" element={<AddContact />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;