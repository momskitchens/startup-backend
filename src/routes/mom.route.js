import Router from "express"
import { registerMom , loginMom,logoutMom,RefreshAccessToken,getCurrentMom,updateAddress,updateAvatar,updateDescription,momProfile,ordersAndPayments, getAllMoms, ordersForMom, userPayments } from "../controllers/mom.controller.js"
import { verifyMOMJWT } from "../middlewares/momAuth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const momRouter = Router()

momRouter.route("/register").post(upload.single("avatarImage"),registerMom)

momRouter.route("/login").post(loginMom)

momRouter.route("/moms-page").get(getAllMoms)

// secured routes

momRouter.route("/logout").post(verifyMOMJWT,logoutMom)

momRouter.route("/refreshing").post(RefreshAccessToken)

momRouter.route("/current-mom").get(verifyMOMJWT,getCurrentMom)

momRouter.route("/update-address").patch(verifyMOMJWT,updateAddress)

momRouter.route("/update-avatar").patch(verifyMOMJWT,upload.single("avatar"),updateAvatar)

momRouter.route("/update-description").patch(verifyMOMJWT,updateDescription)

momRouter.route("/ordersandpayments").get(verifyMOMJWT,ordersAndPayments)

momRouter.route("/mom-profile").get(verifyMOMJWT,momProfile)

momRouter.route("/user-orders").get(verifyMOMJWT,ordersForMom)

momRouter.route("/user-payments").get(verifyMOMJWT,userPayments)

export default momRouter;