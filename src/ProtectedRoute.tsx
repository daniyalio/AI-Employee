import { Navigate } from "react-router-dom";

function ProtectedRoute() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        return <Navigate to="/" />;
    }

    return <h1>Protected Route Works!</h1>;
}

export default ProtectedRoute;