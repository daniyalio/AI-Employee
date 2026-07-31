import "./Login.css";

function Login() {
    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-heading">Login</h1>

                <label htmlFor="email" className="login-label">Email</label>
                <input id="email" className="login-input" type="email" placeholder="Enter your Email" />

                <label htmlFor="password" className="login-label">Password</label>
                <input id="password" className="login-input" type="password" placeholder="Enter your Password" />

                <a className="forgot-password" href="#">Forgot Password?</a>

                <button className="login-button">Login</button>

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