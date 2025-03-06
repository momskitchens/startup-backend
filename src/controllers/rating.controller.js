import { Rating } from "../models/rating.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Mom } from "../models/mom.model.js";

const submitRating = asyncHandler( async(req,res)=>{

    const {momId,rate,feedback} = req.body
    const {userId} = req.user

    if (!mongoose.Types.ObjectId.isValid(momId)) {
        throw new apiError(400,"Invalid momId")
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new apiError(400,"Invalid userId")
    }
    if (!rate || rate < 1 || rate > 5) {
        throw new apiError(400,"Rate must be between 1 and 5")
    }

    const momExits = await Mom.findById(momId);
    if(!momExits){
        throw new apiError(404,"mom not found")
    }

    const newRating = await Rating.create({
        momId,
        userId,
        feedback : feedback ? feedback : " ",
        rate
    })

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            newRating,
            "Feedback Stored Successfully"
        )
    )

})

export {submitRating}