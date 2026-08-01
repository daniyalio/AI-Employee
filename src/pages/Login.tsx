import { useState } from "react";
import "./Login.css";

function Login() {

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string>("");

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!email) {
            setError("Email is required");
            return;
        }
        if (!password) {
            setError("Password is required");
            return;
        }

        console.log("Email:", email);
        console.log("Password:", password);
    }



    return (
        <div className="login-page">
            <div className="login-card">

                <h1 className="login-heading">Login</h1>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email" className="login-label">Email</label>
                    <input
                        id="email"
                        className="login-input"
                        type="email"
                        placeholder="Enter your Email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                    />

                    <label htmlFor="password" className="login-label">Password</label>
                    <div className="password-container">
                        <input
                            id="password"
                            className="login-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setError("");
                            }}
                        />
                        <button
                            className="password-toggle"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            👁
                        </button>
                    </div>
                    <a className="forgot-password" href="#">Forgot Password?</a>
                    {error && <p className="error-message">{error}</p>}
                    <button
                        type="submit"
                        className="login-button"
                    >
                        Login
                    </button>
                </form>
                <div className="signup-section">
                    <p className="signup-text">
                        Don't have an account?

                        <a href="#" className="signup-link">
                            Sign Up
                        </a>
                    </p>
                </div>
            </div>


        </div>
    )
}

export default Login;