import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import TempDetail from "./Pages/Client/TempDetail";
import Review from "./Pages/Client/Review";
import AdminDashboard from "./Mycomponent/AdminDashboard";
import AddTemplate from "./Mycomponent/AddTemplate";
import AddCategory from "./Mycomponent/AddCategory";
import ViewProject from "./Mycomponent/ViewProject";
import Payment from "./Mycomponent/Payment";
import Template from "./Pages/Client/Template";
import ViewPayment from "./Mycomponent/ViewPayment";
import AddContact from "./Mycomponent/AddContact";
import AddFaq from "./Mycomponent/AddFaq";
import Preview from "./Mycomponent/Preview";
import TemplateContentEditor from "./Mycomponent/TemplateContentEditor";
import SiteEditor from "./Pages/Client/SiteEditor";
import SitePreview from "./Pages/Client/SitePreview";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/contact" element={<Contact />} />
            <Route path="/review" element={<Review />} /> 
            <Route path="/myaccount" element={<Myaccount />} />
            <Route path="/viewtemp" element={<Template />}/>
            <Route path="/preview" element={<Preview/>}/>
            <Route path="/payment" element={<Payment />} />
            <Route path="/mysite" element={<MySite/>} />
            <Route path="/mysite/:siteId/preview" element={<SitePreview />} />
            <Route path="/mysite/:siteId" element={<SiteEditor />} />
            <Route path="/detail" element={<TempDetail/>}/>

          </Route>
        </Route>

        <Route element={<ProtectedRoutes role="admin" />}>
          <Route path="/admin" element={<Admin />}>
            <Route path="templates" element={<AddTemplate />} />
            <Route path="templates/:templateId/edit" element={<AddTemplate />} />
            <Route path="templates/:templateId/content" element={<TemplateContentEditor />} />
            <Route path="category" element={<AddCategory />} />
            <Route path="projects" element={<ViewProject />} />
            <Route path="users" element={<ViewUser />} />
            <Route path="usereview" element={<ViewReview />} />
            <Route path="admindashboard" element={<AdminDashboard />} />
            <Route path="invoice" element={<ViewPayment />} />
            <Route path="faq" element={<AddFaq />} />
            <Route path="contact" element={<AddContact />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
