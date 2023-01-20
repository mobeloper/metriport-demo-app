import { Response, Request } from "express";
import Router from "express-promise-router";
import status from "http-status";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../models/db";
import { Config } from "../shared/config";
import { User } from "../models/user";

const router = Router();

/** ---------------------------------------------------------------------------
 * POST /webhook
 *
 * Example route to store info from webhooks
 *
 * @param   {string}  req.header.x-webhook-key  The webhook key.
 * @param   {obj}  req.body.users  The users data.
 *
 * @return  {status}
 */
router.post("/", async (req: Request, res: Response) => {
  const token = req.header("x-webhook-key");
  if (!token) res.sendStatus(status.UNAUTHORIZED);

  if (token !== Config.getMetriportWebhookKey()) {
    return res.sendStatus(status.UNAUTHORIZED);
  }
  let value = req.body;

  try {
    if (value.ping) {
      return res.status(status.OK).json({ pong: value.ping });
    }

    if (value.users && value.users.length > 0) {
      value.users.forEach(async (user: any) => {
        let localUser: User | null = await getDB().user.findOne({
          where: { metriportUserId: user.userId },
        });

        if (localUser) {
          // Insert for sleep the same could be done for other data sets
          if (user.sleep) {
            getDB().sleep.create({
              id: uuidv4(),
              userId: localUser.id,
              value: JSON.stringify(user.sleep),
            });
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(status.INTERNAL_SERVER_ERROR);
  }

  return res.sendStatus(status.OK);
});

export default router;
