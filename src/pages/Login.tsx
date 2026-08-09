import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { loginUser } from "../api/authApi";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    const isFormValid =
        trimmedEmail.includes("@") &&
        trimmedEmail.includes(".") &&
        trimmedPassword.length >= 6;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!trimmedEmail) {
            setError("Email is required");
            return;
        }

        if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
            setError("Invalid email address");
            return;
        }

        if (!trimmedPassword) {
            setError("Password is required");
            return;
        }

        if (trimmedPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await loginUser({
                email: trimmedEmail,
                password: trimmedPassword,
            });

            if (!response.success) {
                setError("Invalid email or password");
                return;
            }

            login(response.token, response.user);

            setSuccess("Login successful!");
            navigate("/dashboard");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-heading">Login</h1>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email" className="login-label">
                        Email
                    </label>

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

                    <label htmlFor="password" className="login-label">
                        Password
                    </label>

                    <div className="password-container">
                        <input
                            id="password"
                            className="login-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your Password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError("");
                            }}
                        />

                        <button
                            className="password-toggle"
                            type="button"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                        >
                            👁
                        </button>
                    </div>

                    <a className="forgot-password" href="#">
                        Forgot Password?
                    </a>

                    {error && (
                        <p className="error-message">{error}</p>
                    )}

                    {success && (
                        <p className="success-message">{success}</p>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={!isFormValid || loading}
                    >
                        {loading ? "Logging in..." : "Login"}
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
    );
}

export default Login;