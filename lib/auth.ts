import bcrypt from "bcryptjs"
import { getDb } from "./db"

export interface User {
  id: number
  email: string
  name: string
  created_at: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const sql = getDb()
  const passwordHash = await hashPassword(password)

  const result = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id, email, name, created_at
  ` as User[]

  return result[0]
}

export async function getUserByEmail(email: string) {
  const sql = getDb()

  const result = await sql`
    SELECT id, email, password_hash, name, created_at
    FROM users
    WHERE email = ${email}
  ` as Array<User & { password_hash: string }>

  return result[0]
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
  }
}
