import { fine } from "@/lib/fine";
import { useLayoutEffect } from "react";
import { Navigate } from "react-router";

export default function LogoutPage() {
  useLayoutEffect(() => {
    fine?.auth.signOut({});
  }, [fine]);

  return !fine ? <Navigate to='/' /> : null;
}
