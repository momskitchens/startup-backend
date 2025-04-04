import Router from "express"
import { registerMom , loginMom,verifyOtp,logoutMom,RefreshAccessToken,getCurrentMom,momProfile,ordersAndPayments, getAllMoms, ordersForMom, userPayments, updateMomProfile, momHome } from "../controllers/mom.controller.js"
import { verifyMOMJWT } from "../middlewares/momAuth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const momRouter = Router()

momRouter.route("/register").post(upload.single("avatarImage"),registerMom)

momRouter.route("/login").post(loginMom)

momRouter.route("/verify-otp").post(verifyOtp)

momRouter.route("/moms-page").get(getAllMoms)

// secured routes

momRouter.route("/logout").post(verifyMOMJWT,logoutMom)

momRouter.route("/refreshing").post(RefreshAccessToken)

momRouter.route("/current-mom").get(verifyMOMJWT,getCurrentMom)

momRouter.route('/mom-home').get(verifyMOMJWT,momHome)

momRouter.route("/update-profile").put(verifyMOMJWT,upload.single("avatar"),updateMomProfile);

momRouter.route("/ordersandpayments").get(verifyMOMJWT,ordersAndPayments)

momRouter.route("/mom-profile").get(verifyMOMJWT,momProfile)

momRouter.route("/user-orders").get(verifyMOMJWT,ordersForMom)

momRouter.route("/user-payments").get(verifyMOMJWT,userPayments)

export default momRouter;