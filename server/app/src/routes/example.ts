import { Response, Request } from "express";
import Router from "express-promise-router";
import status from "http-status";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../models/db";

const router = Router();

/** ---------------------------------------------------------------------------
 * POST /example
 *
 * Example route to store some arbitrary value in the database for the user
 * making the request.
 *
 * @param   {string}  req.query.value  The value to store.
 *
 * @return  {status}
 */
router.post("/", async (req: Request, res: Response) => {
  // validate required query params
  if (!req.query.value) {
    return res.sendStatus(status.BAD_REQUEST);
  }
  let value = req.query.value as string;

  try {
    // create the value in the db
    await getDB().exampleModel.create({
      id: uuidv4(),
      userId: req.id,
      value: parseInt(value),
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(status.INTERNAL_SERVER_ERROR);
  }

  return res.sendStatus(status.OK);
});

/** ---------------------------------------------------------------------------
 * GET /example
 *
 * Example route to get the arbitrary values for the user in the database.
 *
 * @return  {{values: number[]}}  The previous values entered by the user.
 */
router.get("/", async (req: Request, res: Response) => {
  let values: number[] = [];
  try {
    // check to make sure this user hasn't already been created
    const exampleModels = await getDB().exampleModel.findAll({
      where: { userId: req.id },
    });

    if (exampleModels) {
      for (const model of exampleModels) {
        values.push(model.value);
      }
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(status.INTERNAL_SERVER_ERROR);
  }

  return res.send({ values: values });
});

export default router;
