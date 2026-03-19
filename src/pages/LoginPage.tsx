import React, { useState } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (sbd: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [sbd, setSbd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sbd.trim()) {
      onLogin(sbd.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-100 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Đăng Nhập</h1>
          <p className="text-center text-slate-500 mb-8">Hệ thống thi tin học văn phòng online</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số Báo Danh</label>
              <input
                type="text"
                value={sbd}
                onChange={(e) => setSbd(e.target.value)}
                placeholder="Nhập SBD của bạn"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-center text-lg font-mono uppercase"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              VÀO PHÒNG THI
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            Giám sát bởi AI Camera
          </p>
        </div>
      </motion.div>
    </div>
  );
}
