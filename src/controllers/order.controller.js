import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Order} from "../models/order.model.js"
import { CreateRazorpayInstance } from "../config/Razorpay/Razorpay.config.js";
import { Menu } from "../models/menu.model.js";
import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";

const createOrderOnline = asyncHandler(async (req, res) => {
  const { menuId, quantity } = req.body;
  const userId = req.user?._id;

  // Validate menuId
  if (!menuId) {
    return res.status(400).json(new apiError(400, "Menu Id is required"));
  }

  // Check if menu item exists
  const menu = await Menu.findById(menuId);
  if (!menu) {
    return res.status(404).json(new apiError(404, "Menu item not found"));
  }

  // Ensure quantity is at least 1
  const orderQuantity = quantity && quantity > 0 ? quantity : 1;

  // Calculate total amount
  const amount = menu.amount * orderQuantity * 100; // Amount in paise (for Razorpay)

  // Create a Razorpay order instance
  const razorpayInstance =  CreateRazorpayInstance();
  const razorpayOrder = await razorpayInstance.orders.create({
    amount,
    currency: "INR",
    receipt: `order_${Date.now()}`,
  });

  if (!razorpayOrder) {
    return new apiError(404,"Error while creating order at RAZORPAY")
  }

  // Create a new order in the database
  const newOrder = await Order.create({
    userId,
    menuId,
    quantity: orderQuantity,
    razorpayOrderId: razorpayOrder.id,
    amount: amount / 100, // Convert back to rupees
  });

  await newOrder.save();

  return res.status(200).json(
    new apiResponse(200, { order: newOrder, razorpayOrder }, "Order Placed Successfully")
  );
});

const createOrderoffline = asyncHandler(async(req,res)=>{
  const { menuId, quantity } = req.body;
  const userId = req.user?._id;

  // Validate menuId
  if (!menuId) {
    return res.status(400).json(new apiError(400, "Menu Id is required"));
  }

  // Check if menu item exists
  const menu = await Menu.findById(menuId);
  if (!menu) {
    return res.status(404).json(new apiError(404, "Menu item not found"));
  }

  // Ensure quantity is at least 1
  const orderQuantity = quantity && quantity > 0 ? quantity : 1;

  // Calculate total amount
  const amount = menu.amount * orderQuantity;


  const newOrder = await Order.create({
    userId,
    menuId,
    quantity: orderQuantity,
    razorpayOrderId: null,
    amount: amount, // Convert back to rupees
  });

  await newOrder.save();

   const orderId = newOrder._id;
  
    if(!orderId || !userId) return res.status(400).json(new apiError(400,"Required fields is missing"))
  
      const paymentDoc = await Payment.create({
          status : "pending",
          paymentMethod:"COD",
          userId,
          orderId,
          razorpaymentId : null,
          razorpayId: null
      });
   
    await paymentDoc.save();

  return res
  .status(200)
  .json(
    new apiResponse(200,{order : newOrder},"Order placed!")
  )

})

const cancelOrderduetoPayment = asyncHandler(async(req,res)=>{
  const { order_id } = req.body;

  if (!order_id) {
      return res.status(400).json(new apiError(400, "Order ID is required"));
  }

  const updatedOrder = await Order.findOneAndUpdate(
      { razorpayOrderId: order_id },
      { $set: { status: "cancelled" } },
      { new: true }
  );

  if (!updatedOrder) {
      return res.status(404).json(new apiError(404, "Order not found"));
  }

  return res.status(200).json(new apiResponse(200, updatedOrder, "Order cancelled successfully"));
})

const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new apiError(400, "Invalid OrderId");
  }

  const order = await Order.findById(orderId);

  if (!order) throw new apiError(404, "Order does not exist");

  if (order.status === "cancelled") throw new apiError(400, "Order is already cancelled");

  // Cancel Order
  order.status = "cancelled";
  await order.save();

  // Find Payment associated with this order
  const paymentData = await Order.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(orderId),
          }
      },
      {
          $lookup: {
              from: "payments",
              localField: "_id",
              foreignField: "orderId",
              as: "userpayments"
          }
      },
      {
          $unwind: {
              path: "$userpayments",
              preserveNullAndEmptyArrays: true
          }
      },
      {
          $project: {
              paymentId: "$userpayments._id"
          }
      }
  ]);

  const paymentId = paymentData.length > 0 ? paymentData[0].paymentId : null;
  
  if (!paymentId) throw new apiError(404, "No payment associated with this order");

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new apiError(404, "Payment does not exist");

  if (payment.status === "cancel") throw new apiError(400, "Payment is already cancelled");

  // Cancel Payment
  payment.status = "cancel";
  await payment.save();

  return res.status(200).json({
      success: true,
      message: "Order and payment cancelled successfully"
  });
});


const changeOrderStatus= asyncHandler(async(req,res)=>{
    const {orderId} =  req.body

    if(!mongoose.Types.ObjectId.isValid(orderId)){
      return new apiError(400,"Inavalid OrderId")
   }

   const order = await Order.findById(orderId)

   if(!order) return new apiError(404,"Order does not exits")
  
  order.status = 'delivered';

  await order.save();

  return res
  .status(200)
  .json(
    200,
    "",
    "Orders status update"
  )
  
})


  export  {createOrderOnline,createOrderoffline,cancelOrder,cancelOrderduetoPayment,changeOrderStatus}