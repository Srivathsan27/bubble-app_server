import "dotenv/config";

export const PORT = process.env.PORT || 4000;
export const prod = process.env.NODE_ENV === "production";
export const cookieName = "my-cookie";
export const MONGO_URL = `mongodb+srv://dbuser:${process.env.MONGO_PASSWORD}@cluster0.zko7v.mongodb.net/bubble-app?retryWrites=true&w=majority`;
