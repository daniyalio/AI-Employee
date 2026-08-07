import { useNavigate } from "react-router-dom"

function Dashboard() {
    const navigate = useNavigate();

    function handleLogout() {
        localStorage.removeItem("isLoggedIn");
        navigate("/login");
    }
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome! You are logged in.</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Dashboard;
