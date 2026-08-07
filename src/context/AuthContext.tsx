import { createContext, useContext, useState, type ReactNode } from "react";

type AuthContextType = {
    isLoggedIn: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    function login() {
        setIsLoggedIn(true);
    }

    function logout(){
        setIsLoggedIn(false);
    }
   

}