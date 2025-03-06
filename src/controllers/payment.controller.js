import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Payment } from "../models/payment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "crypto";
import { Order } from "../models/order.model.js";

const verifyPayment = asyncHandler(async (req, res) => {
    const { orderId,razorpaymentId, payment_id, signature } = req.body;
    const userId = req.user?._id;

    // Validate required fields
    if (!orderId||!razorpaymentId || !payment_id || !signature) {
        return res.status(400).json(new apiError(400, "Missing required fields"));
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        return res.status(500).json(new apiError(500, "Payment secret key missing"));
    }

    // Generate HMAC signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpaymentId + "|" + payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === signature) {
        // Store payment details in DB
        await Payment.create({
            status: "completed",
            paymentMethod: "UPI",
            userId,
            orderId,
            razorpaymentId,
            razorpayId: payment_id,
        });

        return res.status(200).json(new apiResponse(200, {}, "Payment Verified Successfully"));
    } else {
        return res.status(400).json(new apiResponse(400, {}, "Payment Verification Failed"));
    }
});


const completePayment = asyncHandler(async(req,res)=>{
    const {paymentId} = req.body;

    if(!paymentId){
        return new apiError(404,"Payment ID not found")
    }

    const payment = await Payment.findById(paymentId);
    if(!payment) return new apiError(404,"Wrong payment Id")

    payment.status = "completed";
    await payment.save();

    return res
    .status(200)
    .json(
        new apiResponse(200,"","status changed succesfully")
    )
})




export { verifyPayment,completePayment };
