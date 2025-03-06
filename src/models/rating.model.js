import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
    {
      
        momId:{
            type: Schema.Types.ObjectId,
            ref: "Mom",
            required:true,
            index:true
        },
        UserId:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required:true
        },
        feedback:{
            type:String
        },
        rate:{
            type:Number,
            required:true,
            min:1,
            max:5
        }
    },{
        timestamps: true
    }
)


export const Rating = mongoose.model("Rating",ratingSchema);