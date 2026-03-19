import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Camera,
  ShieldCheck,
  FileText,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraMonitor from '../components/CameraMonitor';

interface Question {
  id: number;
  q: string;
  opts: string[];
}

interface PracContent {
  title: string;
  content: string;
  file: string;
}

export default function ExamPage({ sbd }: { sbd: string }) {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'selection' | 'quiz' | 'prac'>('selection');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pracContent, setPracContent] = useState<PracContent | null>(null);
  const [userAns, setUserAns] = useState<Record<number, string>>({});
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (mode === 'quiz') {
      fetchQuestions();
      setTimeLeft(15 * 60); // 15 minutes
    } else if (mode === 'prac') {
      fetchPracContent();
      setTimeLeft(45 * 60); // 45 minutes
    }
  }, [mode, subject]);

  useEffect(() => {
    if (timeLeft <= 0 || mode === 'selection') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, mode]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/get_questions/${subject}`);
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchPracContent = async () => {
    try {
      const res = await fetch(`/api/get_prac_content/${subject}`);
      const data = await res.json();
      setPracContent(data);
    } catch (error) {
      console.error('Error fetching practical content:', error);
    }
  };

  const handleStart = (newMode: 'quiz' | 'prac') => {
    setMode(newMode);
    setIsMonitoring(true);
  };

  const handleViolation = (count: number) => {
    setViolations(count);
    if (count >= 3) {
      alert('BẠN ĐÃ VI PHẠM 3 LẦN. BÀI THI SẼ BỊ ĐÌNH CHỈ.');
      handleSubmit('violated');
    }
  };

  const handleSubmit = async (status?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsMonitoring(false);

    try {
      if (mode === 'quiz') {
        const res = await fetch('/api/submit_quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sbd,
            subject,
            answers: userAns,
            violations,
            status: status === 'violated' ? 'canceled' : undefined
          })
        });
        const data = await res.json();
        alert(`Nộp bài thành công! Điểm trắc nghiệm: ${data.score}`);
      } else if (mode === 'prac') {
        const formData = new FormData();
        formData.append('sbd', sbd);
        formData.append('subject', subject || '');
        if (uploadFile) formData.append('file', uploadFile);
        if (status === 'canceled') formData.append('status', 'canceled');

        await fetch('/api/submit_practical', {
          method: 'POST',
          body: formData
        });
        alert('Đã nộp bài tự luận thành công!');
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (mode === 'selection') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <SelectionCard 
            title="TRẮC NGHIỆM" 
            icon={ListTodo} 
            color="indigo" 
            description="15 phút làm bài trắc nghiệm kiến thức tổng quát."
            onClick={() => handleStart('quiz')}
          />
          <SelectionCard 
            title="TỰ LUẬN" 
            icon={FileText} 
            color="emerald" 
            description="45 phút thực hành kỹ năng trên phần mềm thực tế."
            onClick={() => handleStart('prac')}
          />
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="fixed top-8 left-8 p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 uppercase">{subject} - {mode === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}</h1>
          </div>
          
          <div className="flex items-center gap-8">
            <div className={`flex items-center gap-3 px-6 py-2 rounded-full font-mono font-bold text-2xl ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-900'}`}>
              <Clock className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              NỘP BÀI
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {mode === 'quiz' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {questions[qIdx] && (
                  <motion.div
                    key={questions[qIdx].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200"
                  >
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Câu hỏi {qIdx + 1}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-12 leading-relaxed">{questions[qIdx].q}</h3>
                    
                    <div className="space-y-4">
                      {questions[qIdx].opts.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setUserAns({ ...userAns, [questions[qIdx].id]: opt })}
                          className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${userAns[questions[qIdx].id] === opt ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                        >
                          <span className={`text-lg font-medium ${userAns[questions[qIdx].id] === opt ? 'text-indigo-900' : 'text-slate-600'}`}>
                            {opt}
                          </span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${userAns[questions[qIdx].id] === opt ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                            {userAns[questions[qIdx].id] === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-8">
                <button 
                  onClick={() => setQIdx(prev => Math.max(0, prev - 1))}
                  disabled={qIdx === 0}
                  className="p-4 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all disabled:opacity-20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <div className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                  {qIdx + 1} / {questions.length}
                </div>
                <button 
                  onClick={() => setQIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={qIdx === questions.length - 1}
                  className="p-4 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all disabled:opacity-20"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-32">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Bản đồ câu hỏi</h4>
              <div className="grid grid-cols-5 gap-3">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setQIdx(i)}
                    className={`aspect-square rounded-xl font-bold transition-all flex items-center justify-center ${qIdx === i ? 'ring-2 ring-indigo-600 ring-offset-2' : ''} ${userAns[q.id] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-100">
                <button 
                  onClick={() => handleSubmit('canceled')}
                  className="w-full py-4 text-red-500 font-bold text-sm uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Hủy bài thi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-3xl font-bold text-slate-900 mb-8">{pracContent?.title}</h3>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {pracContent?.content}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Tài liệu đính kèm</h4>
                {pracContent?.file ? (
                  <a 
                    href={`/api/download_prac_file/${pracContent.file}`}
                    className="w-full p-6 bg-indigo-50 text-indigo-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-100 transition-all"
                  >
                    <Download className="w-6 h-6" />
                    TẢI ĐỀ THI (.PDF)
                  </a>
                ) : (
                  <div className="p-6 bg-slate-50 text-slate-400 rounded-2xl text-center italic">
                    Không có file đính kèm
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Nộp sản phẩm</h4>
                <div className="space-y-6">
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${uploadFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                      {uploadFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-900 truncate max-w-full px-4">{uploadFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-10 h-10 text-slate-200" />
                          <span className="text-sm font-bold text-slate-400">Chọn file bài làm</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSubmit()}
                    disabled={!uploadFile || isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all disabled:opacity-20 disabled:shadow-none"
                  >
                    XÁC NHẬN NỘP BÀI
                  </button>
                </div>
              </div>

              <button 
                onClick={() => handleSubmit('canceled')}
                className="w-full py-4 text-red-500 font-bold text-sm uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Hủy bài thi
              </button>
            </div>
          </div>
        )}
      </main>

      <CameraMonitor onViolation={handleViolation} isMonitoring={isMonitoring} />
    </div>
  );
}

function SelectionCard({ title, icon: Icon, color, description, onClick }: { 
  title: string, 
  icon: any, 
  color: string, 
  description: string,
  onClick: () => void 
}) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-12 rounded-[40px] border-2 text-left transition-all hover:shadow-2xl ${colors[color]}`}
    >
      <div className="p-4 bg-white rounded-2xl w-fit mb-8 shadow-sm">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-3xl font-black mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </motion.button>
  );
}
