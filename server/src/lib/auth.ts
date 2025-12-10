import crypto from "crypto";
import { config } from "../config.js";

const algorithm = "sha256";

export interface Session {
  username: string;
  displayName?: string;
  avatar?: string;
}

export const signToken = (session: Session, ttlSeconds = 24 * 60 * 60): string => {
  const payload = {
    username: session.username,
    displayName: session.displayName,
    avatar: session.avatar,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac(algorithm, config.authSecret).update(encoded).digest("hex");
  return `${encoded}.${signature}`;
};

export const verifyToken = (token: string): Session | null => {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    const expectedSig = crypto.createHmac(algorithm, config.authSecret).update(encoded).digest("hex");
    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Session & { exp: number };
    if (!payload.username || !payload.exp) return null;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    const { exp, ...rest } = payload;
    return rest;
  } catch (err) {
    console.error("token verify failed", err);
    return null;
  }
};

export const extractToken = (header?: string): string | null => {
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1];
  return null;
};
