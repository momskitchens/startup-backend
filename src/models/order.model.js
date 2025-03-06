import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const orderSchema = new Schema(
    {
       date:{
        type:Date,
        default:Date.now()
       },
       status:{
        type:String,
        enum:['ordered', 'preparing', 'delivered', 'cancelled'],
        default:'ordered',  
        index:true
       },
       userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        index:true
       },
       menuId:{
        type:Schema.Types.ObjectId,
        ref:"Menu"
       },
       customerOrderId:{
        type:String,
        unique : true
       },
       razorpayOrderId:{
        type:String,
        index:true
       },
       quantity:{
        type:Number,
        default:1,
       }
    },{
        timestamps:true
    }
)

orderSchema.pre('save',function(next){
    this.customerOrderId = uuidv4();
    next();
})

export const Order = mongoose.model("Order",orderSchema);