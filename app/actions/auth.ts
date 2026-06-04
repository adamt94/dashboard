"use server"

import { createUser, authenticateUser } from "@/lib/auth"
import { createSession, deleteSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { getDb } from "@/lib/db"

export async function register(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  try {
    const user = await createUser(email, password, name)

    // Create initial balance entry
    const sql = getDb()
    await sql`
      INSERT INTO user_balance (user_id, balance)
      VALUES (${user.id}, 0)
    `

    await createSession({ userId: user.id, email: user.email })
    redirect("/dashboard")
  } catch (error: any) {
    if (error.message?.includes("duplicate key")) {
      return { error: "Email already exists" }
    }
    return { error: "Failed to create account" }
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const user = await authenticateUser(email, password)

    if (!user) {
      return { error: "Invalid email or password" }
    }

    await createSession({ userId: user.id, email: user.email })
    redirect("/dashboard")
  } catch (error) {
    return { error: "Failed to login" }
  }
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
