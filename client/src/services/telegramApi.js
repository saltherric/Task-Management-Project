import API from "./api";

const connectTelegram = async () => {
  const response = await API.post("/tasks/connect-telegram");
  return response.data;
};

export { connectTelegram };