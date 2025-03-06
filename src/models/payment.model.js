import mongoose, { Schema } from "mongoose";


const paymentSchema = new Schema(
    {
       date:{
        type:Date,
        default:Date.now()
       },
       status:{
        type:String,
        enum:['pending','completed','cancel'],
        default:'pending',
        index:true
       },
       paymentMethod:{
        type:String,
        enum:["Online","COD"],
        required:true
       },
       userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        index:true
       },
       orderId:{
         type:Schema.Types.ObjectId,
         ref:"Order"
       },
       razororderId:{
        type:String,
        index:true
       },
       razorpayId :{
        type:String,
        index:true
       }
    },{
        timestamps:true
    }
)

export const Payment = mongoose.model("Payment",paymentSchema);