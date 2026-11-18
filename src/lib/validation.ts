import { z } from 'zod'
import { isValidPhone } from '@/lib/phone'

const emailField = z.string().trim().email('Enter a valid email address')
const nameField = z.string().trim().min(2, 'Name must be at least 2 characters')
const passwordField = z.string().min(6, 'Password must be at least 6 characters')
const confirmPasswordField = z.string().min(1, 'Confirm your password')
const phoneField = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .refine(
    (value) => isValidPhone(value),
    'Use international format, e.g. +966 50 123 4567',
  )

export const signInSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const signUpSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const phoneSignInSchema = z.object({
  phone: phoneField,
  password: passwordField,
})

export const phoneSignUpSchema = z
  .object({
    name: nameField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type PhoneSignInValues = z.infer<typeof phoneSignInSchema>
export type PhoneSignUpValues = z.infer<typeof phoneSignUpSchema>

// Backwards-compatible exports for the admin email auth flow
export const emailPasswordSchema = signInSchema
export type EmailPasswordValues = SignInValues
