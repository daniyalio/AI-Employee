import { apiRequest } from "./apiClient";

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    success: boolean;
    token: string;
    user: {
        id: number;
        name: string;
        role: "admin" | "student";
    };
};

export async function loginUser(
    credentials: LoginRequest
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}