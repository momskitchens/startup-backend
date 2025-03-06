import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async(req,_,next)=>{
   try{
    const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        throw new apiError(401,"Unauthorized Request")
    }
    const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodeToken?._id).select("-refreshToken")

    if(!user){
        throw new apiError(404,"Invalid Access Token")
    }
    req.user = user

    next()

   }
   catch(error){
      throw new apiError(401,error?.message || "Invalid Access Token") 
   }

})