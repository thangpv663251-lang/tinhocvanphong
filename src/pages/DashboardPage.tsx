import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Layout, Presentation, CheckCircle2, AlertCircle, Clock, User, Trophy, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardPageProps {
  sbd: string;
  onLogout: () => void;
}

interface SubjectStatus {
  quiz: string;
  prac: string;
  prac_file: string;
}

export default function DashboardPage({ sbd, onLogout }: DashboardPageProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Record<string, SubjectStatus>>({});
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [sbd]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/get_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sbd })
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    { id: 'Word', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Excel', icon: Layout, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'PowerPoint', icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">EXAM ONLINE</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thí sinh</p>
                <p className="text-lg font-mono font-bold text-indigo-600">{sbd}</p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Danh sách môn thi</h2>
            <p className="text-slate-500 text-lg">Vui lòng chọn môn thi để bắt đầu làm bài. Hệ thống sẽ tự động giám sát qua Camera.</p>
          </div>
          <button 
            onClick={() => setShowProfile(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-3 w-fit"
          >
            <Trophy className="w-6 h-6" />
            XEM ĐIỂM CỦA TÔI
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subjects.map((sub, index) => {
            const subStatus = status[sub.id] || { quiz: '', prac: '', prac_file: '' };
            const isCompleted = subStatus.quiz && subStatus.prac_file;
            const isViolated = subStatus.quiz === 'HỦY/VI PHẠM';

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => !isCompleted && !isViolated && navigate(`/exam/${sub.id}`)}
                className={`group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer ${isCompleted || isViolated ? 'opacity-75' : ''}`}
              >
                <div className={`w-16 h-16 ${sub.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <sub.icon className={`w-8 h-8 ${sub.color}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{sub.id}</h3>
                
                <div className="space-y-3">
                  <StatusItem 
                    label="Trắc nghiệm" 
                    value={subStatus.quiz} 
                    isViolated={isViolated}
                  />
                  <StatusItem 
                    label="Tự luận" 
                    value={subStatus.prac_file ? "Đã nộp" : ""} 
                    isViolated={subStatus.prac_file === 'HỦY BỎ'}
                  />
                </div>

                {(isCompleted || isViolated) && (
                  <div className="absolute top-4 right-4">
                    {isViolated ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Profile & Scores Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-2xl">
                    <Trophy className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kết quả học tập</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Thí sinh: {sbd}</p>
                  </div>
                </div>
                <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Môn thi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Trắc nghiệm</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tự luận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map(sub => {
                        const subStatus = status[sub.id] || { quiz: '', prac: '', prac_file: '' };
                        return (
                          <tr key={sub.id}>
                            <td className="px-6 py-4 font-bold text-slate-900">{sub.id}</td>
                            <td className="px-6 py-4">
                              <span className={`font-mono font-bold ${subStatus.quiz === 'HỦY/VI PHẠM' ? 'text-red-500' : 'text-indigo-600'}`}>
                                {subStatus.quiz || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono font-bold text-emerald-600">
                                {subStatus.prac || 'Chưa chấm'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                    <p className="text-sm text-indigo-900 leading-relaxed">
                      Kết quả trên đây bao gồm điểm trắc nghiệm (được chấm tự động) và điểm tự luận (được giáo viên chấm sau khi nộp bài). Nếu có thắc mắc, vui lòng liên hệ hội đồng thi.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowProfile(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  ĐÓNG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusItem({ label, value, isViolated }: { label: string, value: string, isViolated?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      {value ? (
        <span className={`font-bold ${isViolated ? 'text-red-500' : 'text-emerald-600'}`}>
          {value}
        </span>
      ) : (
        <span className="text-slate-300 italic">Chưa làm</span>
      )}
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
