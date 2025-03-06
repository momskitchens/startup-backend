import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST','PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
}))


//basic settings
app.use(express.json({limit:"16kb"})); //setting for making middleware to expect the json file upto limit 16kb
app.use(express.urlencoded({extended:true,limit:"16kb"})); // same for url , () extended is optional
app.use(express.static("public")); //saving pdf , img in public folder in my server
app.use(cookieParser()) //cookies use for crud operations by server  (secure cookies)

//import routes
import userRouter from "./routes/user.route.js"
app.use("/api/v1/users",userRouter) //user routes

import momRouter from "./routes/mom.route.js";
app.use("/api/v1/moms",momRouter) // mom routes

import ratingRouter from "./routes/rating.route.js";
app.use("/api/v1/rateMom",ratingRouter) //rating routes

import menuRouter from "./routes/menu.route.js";
app.use("/api/v1/menu",menuRouter) //menu routes

import orderRouter from "./routes/order.route.js";
app.use("/api/v1/orders",orderRouter) //order routes

import paymentRouter from "./routes/payment.route.js";
app.use("/api/v1/payments",paymentRouter) //payment routes

export {app};