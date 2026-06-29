"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/schemas/authSchema';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', data);
      if (res.data.success && res.data.token) {
        toast.success("Authentication successful");
        login(res.data.token, res.data.user);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
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
      <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 shadow-2xl p-8 md:p-12 relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-indigo-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 text-center mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-white/40 text-sm font-light">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-5">
          
          <div className="space-y-1">
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-white/30" size={16} />
              <input 
                type="email" 
                placeholder="Email address" 
                {...register("email")}
                className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-light placeholder:text-white/20"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs pl-2">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-white/30" size={16} />
              <input 
                type="password" 
                placeholder="Password" 
                {...register("password")}
                className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-light placeholder:text-white/20"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs pl-2">{errors.password.message}</p>
            )}
            <div className="flex justify-end pt-1">
              <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-white/40 font-light">
            Don't have an account?{' '}
            <Link href="/register" className="text-white hover:text-indigo-400 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
