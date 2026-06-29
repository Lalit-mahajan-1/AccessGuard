"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/authSchema';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/forgot-password', data);
      if (res.data.success) {
        setIsSubmitted(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="w-full"
    >
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 md:p-12 relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-blue-50 blur-[50px] pointer-events-none" />

        {isSubmitted ? (
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} className="text-blue-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-slate-900 mb-2">Check your email</h1>
            <p className="text-slate-600 text-sm font-light mb-8 max-w-[250px]">
              We have sent a password reset link to your email address.
            </p>
            <Link 
              href="/login" 
              className="w-full flex items-center justify-center bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <div className="relative z-10 text-center mb-10">
              <h1 className="text-3xl font-medium tracking-tight text-slate-900 mb-2">Reset Password</h1>
              <p className="text-slate-500 text-sm font-light">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-5">
              
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 text-slate-400" size={16} />
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    {...register("email")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-light placeholder:text-slate-400"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-500 text-xs pl-2">{errors.email.message}</p>
                )}
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-3 bg-slate-900 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70 mt-4"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

            </form>

            <div className="mt-8 text-center relative z-10">
              <p className="text-sm text-slate-500 font-light">
                Remembered your password?{' '}
                <Link href="/login" className="text-slate-900 hover:text-blue-600 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
