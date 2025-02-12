import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Create Auth Context
export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                logout();
                return;
            }

            try {
                const response = await fetch("http://127.0.0.1:5000/api/auth/check-session", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    logout();
                }
            } catch (error) {
                console.error("Session check failed", error);
                logout();
            }
        };

        checkSession();
        const interval = setInterval(checkSession, 1 * 60 * 1000); // 🔄 Check every 5 minutes

        return () => clearInterval(interval);
    }, []);

    const login = (token) => {
        localStorage.setItem("token", token);
        setUser("authenticated");
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/signin");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
