import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { setAuthToken } from "../api/apiClient";

type User = {
    id: number;
    name: string;
    role: "admin" | "student";
};

type AuthContextType = {
    isLoggedIn: boolean;
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const isLoggedIn = token !== null;

    function login(newToken: string, newUser: User) {
        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
    }

    function logout() {
        setToken(null);
        setUser(null);
        setAuthToken(null);
    }

    const value = {
        isLoggedIn,
        user,
        token,
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