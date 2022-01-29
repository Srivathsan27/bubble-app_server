import { Schema, model } from "mongoose";

interface TokenProps {
  token: string;
  userId: number;
  createdAt: Date;
}

const TokenSchema = new Schema<TokenProps>({
  token: { type: String, required: true },
  userId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 * 3 },
});

export const Token = model<TokenProps>("token", TokenSchema);
