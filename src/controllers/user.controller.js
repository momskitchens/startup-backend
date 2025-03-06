import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {apiResponse} from "../utils/apiResponse.js"
import { User } from "../models/user.model.js";
import  jwt  from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async(userId)=>{
        
    try{
        const user = await User.findById(userId)
        // generate tokens
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save()
      
        return {accessToken,refreshToken}
    }
    catch(error){
        throw new apiError(500,"Something went wrong while generating Tokens")
    }
}

const parseDuration = (duration) => {
  const unit = duration.slice(-1); // Extract the unit (e.g., 'd' for days)
  const value = parseInt(duration.slice(0, -1)); // Extract the numeric value (e.g., 5)

  switch (unit) {
    case 's': // Seconds
      return value * 1000;
    case 'm': // Minutes
      return value * 60 * 1000;
    case 'h': // Hours
      return value * 60 * 60 * 1000;
    case 'd': // Days
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
};


const registerUser = asyncHandler(async(req,res)=>{

    const {username,number} = req.body

    if(
        [username,number].some((field) => field?.trim() == " ")
    ){
        throw new apiError(400,"All fields are required")
    }

    const pattern = /^\d{10}$/

    if(!pattern.test(number)){
        throw new apiError(400,"Number must be a valid-10 digit number")
    }
    const userExits = await User.findOne({number})

    if(userExits){
        throw new apiError(409,"User's number is already exists")
    }

    const newUser = await User.create({
        username,
        number,
    })

    const createduser = await User.findById(newUser._id).select( "-refreshToken")


    if(!createduser){
        throw new apiError(500,"Something went wrong during registering user")
    }

    return res
    .status(201)
    .json(
        new apiResponse(200,{user : createduser },"User Registered  Successfully! ")
    )

})

const loginUser = asyncHandler(async(req,res)=>{

    const {number} = req.body

    if(number?.trim() == " "){
        throw new apiError(400,"Please enter the number ")
    }

    // const pattern = /^\d{10}$/

    // if(!pattern.test(number)){
    //     throw new apiError(400,"Number must be a valid-10 digit number")
    // }

     console.log(number)
    const userExists = await User.findOne({number})
    if(!userExists){
        throw new apiError(404,"User not found")
    }

    const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(userExists._id)

    const loggedUser = await User.findById(userExists._id).select(" -refreshToken ")

    const Aoptions = {
        httpOnly : true,
        secure : false,
        maxAge : parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
        path : '/',
        sameSite : "Lax"
    }
    const Roptions = {
        httpOnly : true,
        secure : false,
        maxAge : parseDuration(process.env.REFRESH_TOKEN_EXPIRY),
        path : '/',
        sameSite : "Lax"
    }

    return res
    .status(200)
    .cookie("AccessToken",accessToken,Aoptions)
    .cookie("RefreshToken",refreshToken,Roptions)
    .json(
        new apiResponse(
            200,
            {
                user : loggedUser,
            },
            "User logged in Successfully"
        )
    )
})


const logoutUser = asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(
        req?.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly:true,
        secure: true, 
    }

    return res
    .status(200)
    .clearCookie("AccessToken",options)
    .clearCookie("RefreshToken",options)
    .json(
        new apiResponse(
            200,
            {},
            "Logout Succesfully"
        )
    )
})

const RefreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401,"Unauthorized Request")
    }

    try{
        decodeToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id)

        if(!user){
            throw new apiError(401,"Invalid user Token");
        }

        if(user?.refreshToken == incomingRefreshToken){
            throw new apiError(401,"Refresh Token is expired")
        }

        const {newaccessToken,newrefreshToken} = generateAccessTokenAndRefreshToken(user._id)

        const Aoptions = {
          httpOnly : true,
          secure : false,
          maxAge : parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
          path : '/',
          sameSite : "Lax"
      }
      const Roptions = {
          httpOnly : true,
          secure : false,
          maxAge : parseDuration(process.env.REFRESH_TOKEN_EXPIRY),
          path : '/',
          sameSite : "Lax"
      }

        return res
        .status(200)
        .cookie("AcessToken",newaccessToken,Aoptions)
        .cookie("RefreshToken",newrefreshToken,Roptions)
        .josn(
            new apiResponse(
                200,
                {
                    accessToken : newaccessToken,
                    refreshToken : newrefreshToken
                },
                "Access Token Refresh"
            )
        )        
    }catch(error){
        throw new apiError(401,error?.message || "Invalid refresh token")
      }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
     
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            req.user,
            "Current User Fetch Succesfully"
        )
    )
})

const addAddress = asyncHandler( async(req,res)=>{
    
    const user = req.user
    console.log(req.body)
    const {line1,city,state,pincode} =  req.body

    if(
        [line1,city,state,pincode].some((field) => field?.trim() == "")
    )
    {
        throw new apiError(404,"All fields are required")
    }

    const newAddress = {line1,city,state,pincode}

    user.address.push(newAddress)

    await user.save();

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            newAddress,
            "Address Added to user account"
        )
    )

})



const selectAddress = asyncHandler(async (req, res) => {
    
  const user = req.user
  const {addressId} = req.body

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return new apiError(400, "Invalid Address")
  }

  const addrIdx = user.address.findIndex((addr) => addr._id == addressId)

  if(addrIdx == -1) {
      throw new apiError(400, "There is no such address")
  }

  // First, set all addresses to inactive
  user.address.forEach((addr) => {
      addr.active = false
  })

  // Then set the selected address to active
  user.address[addrIdx].active = true

  await user.save()

  return res
  .status(200)
  .json(
      new apiResponse(200, {}, "Address set as default successfully")
  )  
})

const deleteAddress = asyncHandler( async(req,res)=>{
    const user = req.user
    const {addressId} = req.body
    console.log(addressId)
    
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return new apiError(400,"Invalid Address")
    }

    const addressExits = user.address.some((addr)=>addr._id.toString()  == addressId)
    
    if(!addressExits){
        throw new apiError(400,"No such Addess Exits")
    }

    user.address = user.address.filter((addr)=> addr._id != addressId)

    await user.save()

    return res
    .status(200)
    .json(
        new apiResponse(200,{},"Address Delete Successfully")
    )

})


const seeOrders = asyncHandler(async(req,res)=>{
    const user = req.user

    if(!user){
        throw new apiError(404,"User is not login")
    }

    const OrderDetails = await User.aggregate([
      {
        $match: {
          _id: user._id,
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "userOrders"
        }
      },
      {
        $unwind: {
          path: "$userOrders"
        }
      },
      {
        $lookup: {
          from: "payments",
          localField: "userOrders._id",
          foreignField: "orderId",
          as: "userPayments"
        }
      },
      {
        $unwind: {
          path: "$userPayments"
        }
      },
      {
        $lookup: {
          from: "menus",
          localField: "userOrders.menuId",
          foreignField: "_id",
          as: "orderMenus"
        }
      },
      {
        $unwind: {
          path: "$orderMenus"
        }
      },
      {
        $lookup: {
          from: "moms",
          localField: "orderMenus.momId",
          foreignField: "_id",
          as: "momProfile"
        }
      },
      {
        $project: { 
          "userOrders.quantity": 1,
          "userOrders.status": 1,
          "userOrders.date": 1,
          "userOrders._id":1,
          "userPayments.status": 1,
          "userPayments.paymentMethod": 1,
          "orderMenus": 1,
          "momProfile": 1
        }
      }
    ]
    )


    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            OrderDetails,
            "Fetch Orders Successfully"
        )
    )

})


const seePayments = asyncHandler( async(req,res)=>{
    const user = req.user

    if(!user){
        throw new apiError(404,"User is not Logged")
    }

    const userPayments = await User.aggregate([
        {
          $match: {
            _id: user._id,
          },
        },
        {
          $lookup: {
            from: "payment",
            localField: "_id",
            foreignField: "userId",
            as: "userPayment",
          },
        },
        {
          $unwind: "$userPayment",
        },
        {
          $lookup: {
            from: "order",
            localField: "userPayment.orderId",
            foreignField: "_id",
            as: "orderDetail",
          },
        },
        {
          $unwind: "$orderDetail",
        },
        {
          $lookup: {
            from: "menu",
            localField: "orderDetail.menuId",
            foreignField: "_id",
            as: "Menus",
          },
        },
        {
          $unwind: "$Menus",
        },
        {
          $group: {
            _id: "$userPayment",
            Totalamount: {
              $sum: "$Menus.amount",
            },
          },
        },
      ])


      return res
      .status(200)
      .json(
        new apiResponse(200,userPayments,"User Payment Fetch Succefully")
      )
})




export {loginUser,registerUser,logoutUser,addAddress,selectAddress,deleteAddress,seeOrders,seePayments,RefreshAccessToken,getCurrentUser}