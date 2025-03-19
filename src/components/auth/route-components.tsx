import { useFine } from "@/hooks/use-fine";
import { Navigate } from "react-router";

export const GuestRoute = ({ Component }: { Component: () => JSX.Element }) => {
  const fine = useFine();
  return fine.user ? <Navigate to='/' /> : <Component />;
};

export const AuthenticatedRoute = ({ Component }: { Component: () => JSX.Element }) => {
  const fine = useFine();
  return fine.authLoaded && !fine.user ? <Navigate to='/login' /> : <Component />;
};
