import mongoose from "mongoose";
import { USER_DATABASE } from "../constants.js";

const connectDB =async()=>{

    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${USER_DATABASE}`);
        console.log(`\n MongoDB connection  || DB host : ${connectionInstance.connection.host}`);
        // console.log(connectionInstance);
    }
    catch(error){
        console.log("MongoDB connection Failed : " , error);
        process.exit(1);
    }
}


export default connectDB;