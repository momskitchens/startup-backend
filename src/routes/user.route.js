import { Router } from "express";
import {registerUser,loginUser,verifyOtp,logoutUser,getCurrentUser,RefreshAccessToken,addAddress,selectAddress,deleteAddress,seeOrders,seePayments} from  "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/userAuth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/verify-otp").post(verifyOtp)

//secured Routes

userRouter.route("/logout").post(verifyJWT,logoutUser)

userRouter.route("/user").get(verifyJWT,getCurrentUser)

userRouter.route("/refreshing").post(RefreshAccessToken)

userRouter.route("/add-address").post(verifyJWT,addAddress)

userRouter.route("/select-address").patch(verifyJWT,selectAddress)

userRouter.route("/delete-address").delete(verifyJWT,deleteAddress)

userRouter.route("/your-orders").get(verifyJWT,seeOrders)

userRouter.route("./your-payments").get(verifyJWT,seePayments)


export default userRouter;
