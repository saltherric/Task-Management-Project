import { getAuthToken } from "../../helpers/auth";

function getSocketAccessToken() {
  return getAuthToken();
}

export { getSocketAccessToken };