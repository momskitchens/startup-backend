import { Router } from "express";
import { cancelOrder, cancelOrderduetoPayment, changeOrderStatus, createOrderoffline, createOrderOnline} from "../controllers/order.controller.js"
import { verifyJWT } from "../middlewares/userAuth.middleware.js";


const orderRouter = Router()

orderRouter.route("/create-order-online").post(verifyJWT,createOrderOnline)

orderRouter.route("/create-order-offline").post(verifyJWT,createOrderoffline)

orderRouter.route("/cancel-order-online").post(cancelOrderduetoPayment)

orderRouter.route("/cancel-order").patch(cancelOrder)

orderRouter.route("/delivere-order").patch(changeOrderStatus)

export default orderRouter

