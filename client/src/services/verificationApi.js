import API from "./api";

export const resendVerificationEmail = async (email) => {
    return API.post("/auth/resend-verification", { email });
};
