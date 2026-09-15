import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import "./Login.css";

const DEV_EMAIL = "demo@aiemployee.local";
const DEV_PASSWORD = "employee123";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function useDemoAccount() {
    setEmail(DEV_EMAIL);
    setPassword(DEV_PASSWORD);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || password.length < 8) {
      setError("Enter a valid email and a password with at least 8 characters.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      login(await loginUser({ email, password }));
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand"><span>✦</span> AI Employee</div>
        <h1 className="login-heading">Welcome back.</h1>
        <p className="login-subtitle">Sign in to your autonomous workspace.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="login-label">Email</label>
          <input id="email" className="login-input" type="email" placeholder="you@company.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password" className="login-label">Password</label>
          <div className="password-container">
            <input id="password" className="login-input" type={showPassword ? "text" : "password"} placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "◉" : "◌"}</button>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <div className="dev-credentials">
          <strong>Development account</strong>
          <p>Email: <code>{DEV_EMAIL}</code></p>
          <p>Password: <code>{DEV_PASSWORD}</code></p>
          <button type="button" onClick={useDemoAccount}>Use these credentials</button>
        </div>
      </div>
    </div>
  );
}
