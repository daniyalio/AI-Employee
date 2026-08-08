import { createContext, useContext, useState, type ReactNode } from "react";

type AuthContextType = {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem("isLoggedIn") === "true";
    });

    function login() {
        setIsLoggedIn(true);
        localStorage.setItem("isLoggedIn", "true");
    }

    function logout() {
        setIsLoggedIn(false);
        localStorage.removeItem("isLoggedIn");
    }

    const value = {
        isLoggedIn,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const auth = useContext(AuthContext);

    if (auth === null) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return auth;
}
