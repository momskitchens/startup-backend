import mongoose, { Schema } from "mongoose";

const menuSchema = new Schema(
    {

       rice:{
        type:String
       },
       dal:{
        type:String
       },
       subji:[
        {type:String}
       ],
       roti:{
        type:Number
       },
       extra:[
         {type:String}
       ],
       amount:{
        type:Number,
        required:true
       },
       active:{
        type:Boolean,
        default:false
       },
       momId:{
        type:Schema.Types.ObjectId,
        ref:"Mom",
        index:true,
        required: true
       }
    },{
        timestamps:true
    }
)

export const Menu = mongoose.model("Menu",menuSchema);