import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export interface SessionData {
  userId: number
  email: string
}

export async function createSession(data: SessionData) {
  const token = await new SignJWT(data as unknown as JWTPayload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret)

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token.value, secret)
    return payload as unknown as SessionData
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
