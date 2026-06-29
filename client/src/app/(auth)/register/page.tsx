"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '@/schemas/authSchema';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Assuming login logs the user in after registration too
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/register', data);
      if (res.data.success && res.data.token) {
        toast.success("Account created successfully");
        login(res.data.token, res.data.user);
      } else {
        toast.success("Account created. Please log in.");
        // redirect to login if auto-login is not supported
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-emerald-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 text-center mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Create an account</h1>
          <p className="text-white/40 text-sm font-light">
            Join us to ensure perfect accessibility compliance.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-5">
          
          <div className="space-y-1">
            <div className="relative flex items-center">
              <User className="absolute left-4 text-white/30" size={16} />
              <input 
                type="text" 
                placeholder="Full Name" 
                {...register("name")}
                className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-light placeholder:text-white/20"
              />
            </div>
            {errors.name && (
              <p className="text-rose-500 text-xs pl-2">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-white/30" size={16} />
              <input 
                type="email" 
                placeholder="Email address" 
                {...register("email")}
                className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-light placeholder:text-white/20"
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
                className="w-full bg-[#111] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-light placeholder:text-white/20"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs pl-2">{errors.password.message}</p>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isLoading}
            className="w-full group relative flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-70 mt-4"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-white/40 font-light">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:text-emerald-400 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
