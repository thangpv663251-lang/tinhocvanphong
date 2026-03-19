import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileText, Layout, Presentation, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

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
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thí sinh</p>
              <p className="text-lg font-mono font-bold text-indigo-600">{sbd}</p>
            </div>
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
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Danh sách môn thi</h2>
          <p className="text-slate-500 text-lg">Vui lòng chọn môn thi để bắt đầu làm bài. Hệ thống sẽ tự động giám sát qua Camera.</p>
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
