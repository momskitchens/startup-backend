import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { Mom } from "../models/mom.model.js"
import uploadOnCloudinary from "../config/Cloudinary/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Otp } from "../models/otp.model.js";
import {sendSms }from "../config/msgService/twilio.js"
import { User } from "../models/user.model.js";

const generateAccessTokenAndRefreshToken = async (momId) => {

  try {
    const mom = await Mom.findById(momId)
    // generate tokens
    const accessToken = mom.generateAccessToken()
    const refreshToken = mom.generateRefreshToken()

    mom.refreshToken = refreshToken
    await mom.save()

    return { accessToken, refreshToken }
  }
  catch (error) {
    throw new apiError(500, "Something went wrong while generating Tokens")
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

const registerMom = asyncHandler(async (req, res) => {

  const { username, number, line1, state, city, pincode, description } = req.body
  console.log(req.body)
  console.log(req.file)

  if (
    [username, number, line1, state, city, pincode, description].some((field) => field?.trim() == " ")
  ) {
    throw new apiError(400, "All fields are required")
  }

  const pattern = /^\d{10}$/

  if (!pattern.test(number)) {
    throw new apiError(400, "Number must be a valid-10 digit number")
  }

  const address = { line1, state, city, pincode }

  let avatarLocalPath;

  if (req.file) {
    avatarLocalPath = req.file.path
  }

  console.log(avatarLocalPath)

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  console.log(avatar);

  const userExits = await Mom.findOne({ number })

  if (userExits) {
    throw new apiError(409, "User's number is already exists")
  }

  const newMom = await Mom.create({
    username,
    number,
    address,
    description,
    avatar: avatar?.url || " "
  })

  const createdMom = await Mom.findById(newMom._id).select("-refreshToken")

  if (!createdMom) {
    throw new apiError(500, "Something went wrong during registering user")
  }


  return res
    .status(201)
    .json(
      new apiResponse(200, '', "Mom Registered")
    )

})

const getAllMoms = asyncHandler(async (req, res) => {
  // Extract query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Get total count
  const total = await Mom.countDocuments();

  // Fetch moms with only required fields
  const moms = await Mom.find({})
    .select('username description avatar') // Only select these fields
    .sort({ [sortBy]: order })
    .skip(skip)
    .limit(limit);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return res.status(200).json(
    new apiResponse(200, {
      moms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    }, "Profiles fetched successfully!")
  );
});


const momHome = asyncHandler(async (req, res) => {
  const mom = req.mom;

  if (!mom) {
    throw new apiError(404, "Authentication error");
  }

  const data = await Mom.aggregate([
    {
      $match: {
        _id: mom._id,
      },
    },
    {
      $lookup: {
        from: "menus",
        localField: "_id",
        foreignField: "momId",
        as: "momMenus",
      },
    },
    {
      $lookup: {
        from: "orders",
        localField: "momMenus._id",
        foreignField: "menuId",
        as: "momOrders",
      },
    },
    {
      $unwind: {
        path: "$momOrders",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        "momOrders.status": "delivered",
      },
    },
    {
      $group: {
        _id: "$_id",
        totalOrders: { $sum: 1 },
        momMenus: { $push: "$momMenus" },
      },
    },
    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "momId",
        as: "ratings",
      },
    },
    {
      $addFields: {
        averageRating: { $avg: "$ratings.rating" },
        latestRatings: { $slice: ["$ratings", -3] },
      },
    },
    {
      $project: {
        momMenus: 1,
        totalOrders: 1,
        averageRating: 1,
        latestRatings: 1,
      },
    },
  ]);

  return res.status(200).json(new apiResponse(200, data, "Mom home data fetched successfully!"));
});

const loginMom = asyncHandler(async (req, res) => {
  const { number } = req.body

  if (number?.trim() == " ") {
    throw new apiError(400, "Please enter the number ")
  }

  const pattern = /^\d{10}$/

  if (!pattern.test(number)) {
    throw new apiError(400, "Number must be a valid-10 digit number")
  }

  const userExists = await User.findOne({number})
  
  if(userExists){
    throw new apiError(400,"user account already exists , cannot login as mom")
  }

  const otpExits = await Otp.findOne({ phone: number })

  if(otpExits){
    throw new apiError(400, "OTP already sent")
  }

  const momExists = await Mom.findOne({ number })

  if (!momExists) {
    throw new apiError(404, "Mom not found")
  }

  const code = Math.floor(100000 + Math.random() * 900000)

  const sendmsg = await sendSms({ number, code })

  if (!sendmsg) {
    throw new apiError(500, "Something went wrong while sending OTP")
  }

  
  const otpSchema = await Otp.create({
    phone: number,
    code
  })

  if (!otpSchema) {
    throw new apiError(500, "Something went wrong while creating OTP")
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, '', "OTP sent successfully")
    )


})


const verifyOtp = asyncHandler(async (req, res) => {
  const { number, code } = req.body

  if (!number || !code) {
    throw new apiError(400, "Number and code are required")
  }

  const momExists = await Mom.findOne({ number })

  if (!momExists) {
    throw new apiError(404, "User not found ")
  }

  const otp = await Otp.findOne({ phone: number })

  if (!otp) {
    throw new apiError(404, "No OTP found for this number or OTP is expired")
  }

  if (otp.code != code) {
    throw new apiError(400, "Invalid OTP")
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(momExists._id)

  const loggedUser = await Mom.findById(momExists._id).select(" -refreshToken ")


  const Aoptions = {
    httpOnly: true,
    secure: false,
    maxAge: parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
    path: '/',
    sameSite: "Lax"
  }
  const Roptions = {
    httpOnly: true,
    secure: false,
    maxAge: parseDuration(process.env.REFRESH_TOKEN_EXPIRY),
    path: '/',
    sameSite: "Lax"
  }
  return res
    .status(200)
    .cookie("AccessToken", accessToken, Aoptions)
    .cookie("RefreshToken", refreshToken, Roptions)
    .json(
      new apiResponse(
        200,
        {
          mom: loggedUser
        },
        "Mom logged in Successfully"
      )
    )
})


const logoutMom = asyncHandler(async (req, res) => {

  await Mom.findByIdAndUpdate(
    req?.mom._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(
      new apiResponse(
        200,
        {},
        "Logout Succesfully"
      )
    )
})

const RefreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies?.RefreshToken || req.body?.refreshToken

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized Request")
  }

  try {
    decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const mom = await Mom.findById(decodeToken?._id)

    if (!mom) {
      throw new apiError(401, "Invalid mom Token");
    }

    if (mom?.refreshToken == incomingRefreshToken) {
      throw new apiError(401, "Refresh Token is expired")
    }

    const { accessToken: newaccessToken, refreshToken: newrefreshToken } = generateAccessTokenAndRefreshToken(mom._id)

    const Aoptions = {
      httpOnly: true,
      secure: false,
      maxAge: parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
      path: '/',
      sameSite: "Lax"
    }
    const Roptions = {
      httpOnly: true,
      secure: false,
      maxAge: parseDuration(process.env.REFRESH_TOKEN_EXPIRY),
      path: '/',
      sameSite: "Lax"
    }

    return res
      .status(200)
      .cookie("AcessToken", newaccessToken, Aoptions)
      .cookie("RfreshToken", newrefreshToken, Roptions)
      .josn(
        new apiResponse(
          200,
          {
            accessToken: newaccessToken,
            refreshToken: newrefreshToken
          },
          "Access Token Refresh"
        )
      )
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token")
  }
})



const getCurrentMom = asyncHandler(async (req, res) => {

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        req.mom,
        "Current mom Fetch Succesfully"
      )
    )
})





const updateMomProfile = asyncHandler(async (req, res) => {

  const momId = req.mom?._id;

  if (!momId) {
    throw new apiError(401, "Unauthorized access or mom not found");
  }

  // Extract data from request body
  const { description } = req.body;

  // Extract address fields
  const addressUpdate = {};
  if (req.body["line1"]) addressUpdate.line1 = req.body["line1"];
  if (req.body["city"]) addressUpdate.city = req.body["city"];
  if (req.body["state"]) addressUpdate.state = req.body["state"];
  if (req.body["pincode"]) addressUpdate.pincode = req.body["pincode"];

  console.log(addressUpdate)

  // Prepare update object
  const updateData = {};

  // Add description if provided
  if (description) {
    updateData.description = description;
  }

  // Add address update if any field is provided
  if (Object.keys(addressUpdate).length > 0) {
    updateData.address = addressUpdate;
  }

  // Handle avatar upload if file is provided
  if (req.file) {
    const avatarLocalPath = req.file.path;

    if (!avatarLocalPath) {
      throw new apiError(400, "Avatar file is required");
    }

    // Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar || !avatar.url) {
      throw new apiError(500, "Error while uploading avatar image to cloudinary");
    }

    // Add avatar URL to update data
    updateData.avatar = avatar.url;
  }

  // Ensure we have something to update
  if (Object.keys(updateData).length === 0) {
    throw new apiError(400, "Please provide at least one field to update");
  }

  // Update mom in database
  const updatedMom = await Mom.findByIdAndUpdate(
    momId,
    {
      $set: updateData
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedMom) {
    throw new apiError(404, "Mom not found");
  }

  // Return successful response
  return res.status(200).json(
    new apiResponse(
      200,
      updatedMom,
      "Profile updated successfully"
    )
  );

});


const userPayments = asyncHandler(async (req, res) => {
  const mom = req.mom;

  if (!mom) {
    return new apiError(404, "Authentication error")
  }

  const data = await Mom.aggregate([
    {
      $match: {
        _id: mom._id
      }
    },
    {
      $lookup: {
        from: "menus",
        localField: "_id",
        foreignField: "momId",
        as: "momMenus"
      }
    },
    {
      $unwind: "$momMenus"
    },
    {
      $lookup: {
        from: "orders",
        localField: "momMenus._id",
        foreignField: "menuId",
        as: "userOrders"
      }
    },
    {
      $unwind: "$userOrders"
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
      $unwind: "$userPayments"
    },
    {
      $project: {
        userPayments: 1,
        customerOrderId: "$userOrders.customerOrderId",
        amount: "$momMenus.amount",
        quantity: "$userOrders.quantity",
      }
    }

  ])

  return res
    .status(200)
    .json(
      new apiResponse(200, data, "payments fetched!!")
    )
})

const ordersForMom = asyncHandler(async (req, res) => {
  const mom = req.mom;


  if (!mom) {
    throw new apiError(404, "Authentication error")
  }

  const data = await Mom.aggregate([
    [
      {
        $match: {
          _id: mom?._id
        }
      },
      {
        $lookup: {
          from: "menus",
          localField: "_id",
          foreignField: "momId",
          as: "momMenus"
        }
      }, {
        $unwind: "$momMenus"
      }, {
        $lookup: {
          from: "orders",
          localField: "momMenus._id",
          foreignField: "menuId",
          as: "momOrders"
        }
      }, {
        $unwind: "$momOrders"
      },
      {
        $project: {
          momOrders: 1,
          momMenus: 1
        }
      }
    ]
  ])

  return res
    .status(200)
    .json(
      new apiResponse(200, data, "Orders Fetched !!")
    )
})


const ordersAndPayments = asyncHandler(async (req, res) => {
  const mom = req.mom


  if (!mom) {
    throw new apiError(404, "Authentication error")
  }

  const data = await Mom.aggregate([
    [
      {
        $match: {
          _id: mom?._id,
        },
      },
      {
        $lookup: {
          from: "menu",
          localField: "_id",
          foreignField: "momId",
          as: "momMenu",
        },
      },
      {
        $unwind: "$momMenu",
      },
      {
        $lookup: {
          from: "order",
          localField: "momMenu._id",
          foreignField: "menuId",
          as: "Orders",
        },
      },
      {
        $unwind: "$Orders",
      },
      {
        $lookup: {
          from: "payment",
          localField: "Orders._id",
          foreignField: "OrderId",
          as: "Payment"
        }
      },
      {
        $project: {
          Orders: 1,
          momMenu: 1,
          Payment: 1
        },
      },
    ]
  ])

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        data,
        "Order Fetched Successfully"
      )
    )
})

const momProfile = asyncHandler(async (req, res) => {
  const mom = req.mom

  if (!mom) {
    throw new apiError(404, "Authentication error")
  }

  const data = await Mom.aggregate([
    [
      {
        $match: {
          _id: mom._id,
        },
      },
      {
        $lookup: {
          from: "menu",
          localField: "_id",
          foreignField: "momId",
          as: "momMenu",
        },
      },
      {
        $unwind: "$momMenu",
      },
      {
        $lookup: {
          from: "order",
          localField: "momMenu._id",
          foreignField: "menuId",
          as: "Orders",
        },
      },
      {
        $unwind: "$Orders",
      },
      {
        $group: {
          _id: "$_id",
          TotalAmount: { $sum: "$momMenu.amount" },
          Orders: { $push: "$Orders" },
        },
      },
      {
        $addFields: {
          TotalOrders: { $size: "$Orders" },
        },
      },
      {
        $lookup: {
          from: "rating",
          localField: "_id",
          foreignField: "momId",
          as: "ratings",
        },
      },
      {
        $project: {
          Orders: 0,
        },
      },
    ]
  ])

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        data,
        "Information Fetched Succesfully"
      )
    )
})



export { registerMom, loginMom,verifyOtp, logoutMom, RefreshAccessToken, getCurrentMom, updateMomProfile, momHome, ordersAndPayments, momProfile, getAllMoms, ordersForMom, userPayments }