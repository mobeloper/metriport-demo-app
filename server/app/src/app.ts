import * as dotenv from "dotenv";
dotenv.config();
import express, { Application, Response, Request } from "express";
import mountRoutes from "./routes/index";
import cors from "cors";
import initDB from "./models/db";
import { getEnvVarOrFail } from "./shared/config";

const port = getEnvVarOrFail('PORT');

const APP_PORT = parseInt(port);
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

mountRoutes(app);
module.exports = app;

// route is used for health checks
app.get("/", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.listen(APP_PORT, "0.0.0.0", async () => {
  // initialize connection to the databases
  await initDB();
  console.log(`[server]: app server is running on port ${APP_PORT} :)`);
});
