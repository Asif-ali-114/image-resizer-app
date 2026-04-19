import { useContext } from "react";
import { ToastContext } from "../context/ToastContext.jsx";

export default function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
