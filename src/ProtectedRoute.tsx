import { Navigate } from "react-router-dom";

function ProtectedRoute( {children} )  {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if(!isLoggedIn){
        return <Navigate to = "/login" replace />
    }
    return children;
}

export default ProtectedRoute;

/*function ProtectedRoute(props) {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return props.children;
}
    */