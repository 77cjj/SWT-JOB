import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export type VerifiedAppleClaims = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
};

/** 校验 Apple id_token（Vercel 侧或 apple-callback 使用） */
export async function verifyAppleIdToken(
  idToken: string,
  clientId: string,
): Promise<VerifiedAppleClaims> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });

  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) {
    throw new Error("Apple 登录缺少用户标识");
  }

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";

  if (email && emailVerified === false) {
    throw new Error("请先在 Apple ID 中验证邮箱");
  }

  return { sub, email, emailVerified };
}
