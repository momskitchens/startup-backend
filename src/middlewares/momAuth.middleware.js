import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { Mom } from "../models/mom.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyMOMJWT = asyncHandler(async (req, _, next) => {
    try {
       const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ", "");

       
       if (!token) {
          return next(new apiError(401, "Unauthorized Request"));
       }
 
       const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
 
       const mom = await Mom.findById(decodeToken?._id).select("-refreshToken");
 
       if (!mom) {
          return next(new apiError(404, "Invalid Access Token"));
       }
 
       req.mom = mom;

       next();
       
    } catch (error) {
       return next(new apiError(401, error?.message || "Invalid Access Token"));
    }
 });
 