import jwt, { type SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_change_me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_change_me";

const ACCESS_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.REFRESH_TOKEN_EXPIRY || "7d") as SignOptions["expiresIn"];

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
