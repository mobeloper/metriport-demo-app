import { Response, Request } from "express";
import Router from "express-promise-router";
import status from "http-status";

import { getDB } from "../models/db";
import { metriportClient } from "../shared/metriport-api";

const router = Router();

/** ---------------------------------------------------------------------------
 * Get /user/connect/token
 *
 * Gets a session token for the Metriport Connect widget.
 *
 * @return  {string}  The session token.
 */
router.get("/connect/token", async (req: Request, res: Response) => {
  let token = "";
  try {
    // get the user ID that uniquely identifies this user in Metriport
    const metriportUserId = await metriportClient.getMetriportUserId(
      req.id
    );

    // save the id in the db for future API calls, if it doesn't exist already
    await getDB().user.findOrCreate({
      where: { id: req.id },
      defaults: { id: req.id, metriportUserId: metriportUserId },
    });

    const connectToken = await metriportClient.getConnectToken(metriportUserId);

    token = connectToken;
  } catch (error) {
    console.error(error);
    return res.sendStatus(status.INTERNAL_SERVER_ERROR);
  }

  return res.send(token);
});

/** ---------------------------------------------------------------------------
 * Get /user
 *
 * Gets all the user data for the user for the specified date.
 *
 * @param   {string}  date  The date to pull user data for.
 *
 * @return  {object}  The user data.
 */
router.get("/", async (req: Request, res: Response) => {
  const date = req.query.date as string;

  if (!date) {
    res.send(status.BAD_REQUEST);
  }
  // TODO: define a data model
  let userData = {};
  try {
    // get the metriport user ID corresponding to this user
    let user = await getDB().user.findByPk(req.id);
    if (!user) {
      return res.send(status.BAD_REQUEST);
    }

    const data = metriportClient.getUserData(user.metriportUserId, date)

    userData = data;
  } catch (error) {
    console.error(error);
    return res.sendStatus(status.INTERNAL_SERVER_ERROR);
  }

  return res.send(userData);
});

export default router;
