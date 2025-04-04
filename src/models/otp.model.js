import mongoose , {Schema} from 'mongoose';

const otp = new Schema({
    phone: {type: String, required: true, index: true},
    code: {type: String, required: true},
    createAt : {type: Date, default: Date.now, expires: '5m'}
})


export const Otp = mongoose.model('Otp', otp);