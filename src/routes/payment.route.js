import Router from "express"
import {  completePayment, verifyPayment } from "../controllers/payment.controller.js"
import { verifyJWT } from "../middlewares/userAuth.middleware.js"
import { verifyMOMJWT } from "../middlewares/momAuth.middleware.js"

const paymentRouter = Router()

paymentRouter.route("/verify-payment").post(verifyJWT,verifyPayment)

paymentRouter.route("/complete-payment").patch(verifyMOMJWT,completePayment);

export default paymentRouter