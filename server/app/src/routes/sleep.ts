import { Response, Request } from "express";
import Router from "express-promise-router";
import status from "http-status";
import { v4 as uuidv4 } from "uuid";

import { getDB } from "../models/db";
import { metriportClient } from "../shared/metriport-api";

const router = Router();

/** ---------------------------------------------------------------------------
 * Get /sleep
 *
 * Gets all the sleep data for the user for the specified date.
 *
 * @param   {string}  date  The date to pull sleep data for.
 *
 * @return  {object}  The sleep data.
 */
router.get("/", async (req: Request, res: Response) => {
  const date = req.query.date as string;

  if (!date) {
    res.send(status.BAD_REQUEST);
  }
  try {
    // get the metriport user ID corresponding to this user
    let user = await getDB().user.findByPk(req.id);

    if (!user) {
      return res.send(status.BAD_REQUEST);
    }

    const data = await metriportClient.getSleepData(user.metriportUserId, date);

    getDB().sleep.create({
      id: uuidv4(),
      userId: user.metriportUserId,
      value: JSON.stringify(data)
    })

    res.send(data);
  } catch (error) {
    console.error(error);
    return res.sendStatus(status.INTERNAL_SERVER_ERROR);
  }
});

export default router;
