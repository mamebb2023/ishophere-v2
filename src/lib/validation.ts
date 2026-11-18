import { z } from 'zod'
import { isValidPhone } from '@/lib/phone'

export const emailField = z.string().trim().email('Enter a valid email address')
export const nameField = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name is too long')
export const passwordField = z.string().min(6, 'Password must be at least 6 characters')
const confirmPasswordField = z.string().min(1, 'Confirm your password')
export const phoneField = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .refine((value) => isValidPhone(value), 'Enter a valid phone number')

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
