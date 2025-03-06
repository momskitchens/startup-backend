import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";



const addressSchema = new Schema({
    line1: { type: String, required: true }, // Street address
    city: { type: String, required: true }, // City
    state: { type: String, required: true }, // State
    pincode: { type: String, required: true } // Postal code
  });

const momSchema = new Schema(
    {
       username:{
         type: String,
         required: true, 
       },
        number:{
            type:String,
            unique:true,
            required:true,
            index:true
        },
        avatar: {
            type : String, //cloudinary url
            required : true
        },
        description:{
            type:String,
        },
        address: addressSchema,
        refreshToken:{
            type:String
        }
    },
    {
        timeStamps: true
    }
)

momSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            number: this.number,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


momSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

export  const Mom = mongoose.model("Mom",momSchema);