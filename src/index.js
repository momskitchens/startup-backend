import dotenv  from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path : './env'
})

connectDB()
.then(()=>{

    app.on("error",(error)=>{
        console.log("Error After connection mongoDB :" , error);
        throw error;
    })

    app.listen(process.env.PORT || 5000 , ()=>{
        console.log(`server is running at Port  : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection Failed :", err);
})