import { Application } from "express";
import { processAuthorization } from "./middlewares/auth";
import example from "./example";
import user from "./user";
import activity from "./activity";
import body from "./body";
import biometrics from "./biometrics";
import nutrition from "./nutrition";
import sleep from "./sleep";
import webhook from './webhook';

export default (app: Application) => {
  app.use("/example", processAuthorization, example);
  app.use("/user", processAuthorization, user);
  app.use("/activity", processAuthorization, activity);
  app.use("/body", processAuthorization, body);
  app.use("/biometrics", processAuthorization, biometrics);
  app.use("/nutrition", processAuthorization, nutrition);
  app.use("/sleep", processAuthorization, sleep);
  app.use("/webhook", webhook);
};
