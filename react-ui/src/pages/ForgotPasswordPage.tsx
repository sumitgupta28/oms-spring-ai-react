import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ShoppingBag, CheckCircle } from 'lucide-react'
import { userApi } from '../api/userApi'

interface ForgotForm {
  email: string
}

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>()

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true)
    try {
      await userApi.forgotPassword(data.email)
      setSubmittedEmail(data.email)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-lg mb-4">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">OMS Portal</h1>
          <p className="text-gray-500 mt-1">Order Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {submitted ? (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <span className="font-medium text-gray-700">{submittedEmail}</span>,
                a password reset link has been sent.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                For local testing, check Mailhog at{' '}
                <a href="http://localhost:8025" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  localhost:8025
                </a>
              </p>
              <Link to="/login" className="text-brand-600 font-medium hover:underline text-sm">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                    })}
                    type="email"
                    autoComplete="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                <Link to="/login" className="text-brand-600 font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
