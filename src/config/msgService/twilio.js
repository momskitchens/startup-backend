import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken =process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);


async function sendSms({number, code}) {
    number = `+91${number}`;
    try {
        const message = await client.messages
            .create({
                body: `Your verification code is ${code}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: number
            })

            return message;
    }

    catch (error) {
        console.log(error);
        return null;
    }

}

export {sendSms};