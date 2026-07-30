import "./Login.css";

function Login() {
    return (
        <div>
            <h1>Login</h1>

            <input type="email" placeholder ="Email" />
            <br />
            
            <input type="password" placeholder="Password"/>
            <br />
            <button>Login</button>
        </div>
    )
}

export default Login;