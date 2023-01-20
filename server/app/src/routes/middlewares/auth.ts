import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Config } from "../../shared/config";

// get the user id from the auth token on every request
export const processAuthorization = (req: Request, res: Response, next: NextFunction): void => {
  try {
    var tokenStr = req.header("Authorization") as string;
    var token = jwt.decode(tokenStr) as jwt.JwtPayload;
    req.id = token.sub!;
  } catch (error) {
    console.error(error);
  }

  // if there was no token and this isn't a prod env, just set some dummy value
  if (!req.id && !Config.isProdEnv()) {
    req.id = "b84c7c6c-6dfb-11ed-a1eb-0242ac120002";
  }

  next();
};