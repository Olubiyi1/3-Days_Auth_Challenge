import dotenv from "dotenv"
dotenv.config()

export default{
    mongo_url:process.env.MONGO_URL,
    port:process.env.PORT,
    email_verification:process.env.EMAIL_VERIFICATION,
    refresh_token_expires:process.env.REFRESH_TOKEN_EXPIRY_MS,
    max_attempts:Number(process.env.MAX_ATTEMPTS),
    lock_time:Number(process.env.LOCK_TIME),
    secret_key:process.env.JWT_SECRET
}
