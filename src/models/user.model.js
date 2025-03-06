import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";


const addressSchema = new Schema({
    line1: { type: String, required: true }, // Street address
    city: { type: String, required: true }, // City
    state: { type: String, required: true }, // State
    pincode: { type: String, required: true }, // Postal code
    active: {type:Boolean,default: false }
  });

const userSchema = new Schema(
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
        address: [addressSchema],
        refreshToken:{
            type:String
        }
    },
    {
        timeStamps: true
    }
)

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            number: this.number,
        },
        process.env.ACCESS_TOKEN_SECRET ,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);
export const Address = mongoose.model("Address",addressSchema);