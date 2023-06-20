import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateOrganization from "./pages/CreateOrganization";
import RecoverPassword from "./pages/RecoverPassword";
import Graphic from "./pages/Graphic";
import Graphic2 from "./pages/Graphic2";
import Graphic3 from "./pages/Graphic3";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/graphic" element={<Graphic />} />
        <Route path="/graphic2" element={<Graphic2 />} />
        <Route path="/graphic3" element={<Graphic3 />} />
        <Route path="/createOrganization" element={<CreateOrganization />} />
        <Route path="/recoverPassword" element={<RecoverPassword />} />
        <Route path="/" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
