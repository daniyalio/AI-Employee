import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

type ProtectedRouteProps = {
    children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;