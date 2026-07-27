// Import our main API client configuration
import API from "./api";

// This function sends a patch request to update the user's profile info
const updateProfile = async (profileData) => {
  const response = await API.patch("/auth/profile", profileData);
  return response.data;
};

// This function fetches the current user's profile details from the server
const getProfile = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

// Export the functions so other files can import and use them
export { updateProfile, getProfile };
