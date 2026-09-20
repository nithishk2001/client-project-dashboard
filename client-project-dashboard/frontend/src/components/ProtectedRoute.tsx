import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Role } from "../types";

interface Props {
  children: JSX.Element;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
