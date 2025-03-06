import { Router } from "express";
import { submitRating } from "../controllers/rating.controller.js";
import { verifyJWT } from "../middlewares/userAuth.middleware.js";

const ratingRouter = Router()

ratingRouter.route("/rate").post(verifyJWT,submitRating)

export default ratingRouter