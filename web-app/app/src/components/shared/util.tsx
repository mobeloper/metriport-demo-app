import { Auth } from "aws-amplify";
import { CognitoUser } from "@aws-amplify/auth";
import { CognitoUserSession } from "amazon-cognito-identity-js";

export function isProd() {
  return process.env.NODE_ENV === 'production';
}

export const fetchUserToken = async function () {
  const user: CognitoUser = await Auth.currentAuthenticatedUser();
  try {
    const token = await new Promise<string>((res, rej) => {
      user.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            rej(err);
            return;
          }
          if (session) {
            res(session.getIdToken().getJwtToken());
          }
          res("");
        }
      );
    });
    return token;
  } catch (error) {
    console.error(error);
    return "";
  }
};

