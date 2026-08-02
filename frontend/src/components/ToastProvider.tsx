"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="colored"
    />
  );
}
