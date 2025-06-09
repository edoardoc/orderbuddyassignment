import Session from "supertokens-web-js/recipe/session";

export const checkSessionStatus = async () => {
  try {
    return await Session.doesSessionExist();
  } catch (error) {
    console.error("Session check error:", error);
    return false;
  }
};
