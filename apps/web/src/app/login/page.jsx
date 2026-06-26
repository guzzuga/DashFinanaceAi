"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Username atau password salah");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Inter', sans-serif" }}
      className="min-h-screen bg-[#06080F] flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366F1]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="bg-[#0D1220]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <img
              src="/images/ac-logo.jpg"
              alt="Agus Collection"
              className="w-28 h-28 rounded-full mb-6 object-cover"
              style={{ boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)' }}
            />
            <h1
              className="text-3xl text-[#F9FAFB] font-medium tracking-[0.04em]"
              style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
            >
              Agus Collection
            </h1>
            <span className="text-[11px] text-[#8A8F98] tracking-[0.2em] uppercase mt-2 font-medium">
              Business OS
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#F9FAFB] ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#6366F1] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label="Username"
                  className="w-full bg-[#111827]/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#F9FAFB] ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] group-focus-within:text-[#6366F1] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Password"
                  className="w-full bg-[#111827]/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-12 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 focus:border-[#6366F1] transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-[#F9FAFB] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:from-[#4F46E5] hover:to-[#2563EB] text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                role="alert"
                className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] p-4 rounded-xl text-center text-sm font-medium flex items-center justify-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
                className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] p-4 rounded-xl text-center text-sm font-medium flex items-center justify-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Login Berhasil! Redirecting...
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#94A3B8] text-sm">
            &copy; 2026 Agus Collection. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
