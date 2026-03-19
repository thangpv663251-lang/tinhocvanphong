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
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [showConfirm, setShowConfirm] = useState<{ type: 'submit' | 'cancel', mode: 'quiz' | 'prac' } | null>(null);
  const [examStatus, setExamStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchStatus();
  }, [sbd]);

  useEffect(() => {
    if (mode === 'quiz') {
      if (examStatus[subject || '']?.quiz) {
        alert('Bạn đã hoàn thành phần thi trắc nghiệm này!');
        setMode('selection');
        return;
      }
      fetchQuestions();
      setTimeLeft(15 * 60); // 15 minutes
    } else if (mode === 'prac') {
      if (examStatus[subject || '']?.prac_file) {
        alert('Bạn đã hoàn thành phần thi tự luận này!');
        setMode('selection');
        return;
      }
      fetchPracContent();
      setTimeLeft(45 * 60); // 45 minutes
    }
  }, [mode, subject, examStatus]);

  useEffect(() => {
    if (timeLeft <= 0 || mode === 'selection') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(mode, 'timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, mode]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/get_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sbd })
      });
      const data = await res.json();
      setExamStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

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
    const currentSub = subject || '';
    if (newMode === 'quiz' && examStatus[currentSub]?.quiz) {
      alert('Bạn đã hoàn thành phần thi trắc nghiệm này!');
      return;
    }
    if (newMode === 'prac' && examStatus[currentSub]?.prac_file) {
      alert('Bạn đã hoàn thành phần thi tự luận này!');
      return;
    }
    setMode(newMode);
    setIsMonitoring(true);
  };

  const handleViolation = (count: number) => {
    setViolations(count);
    if (count >= 3) {
      handleSubmit(mode, 'violated');
    }
  };

  const handleSubmit = async (submitMode: 'quiz' | 'prac', status?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsMonitoring(false);
    setShowConfirm(null);

    try {
      if (submitMode === 'quiz') {
        const res = await fetch('/api/submit_quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sbd,
            subject,
            answers: userAns,
            violations,
            status: status === 'violated' || status === 'canceled' ? 'canceled' : 'completed'
          })
        });
        const data = await res.json();
        if (status === 'violated') {
          alert('BẠN ĐÃ VI PHẠM 3 LẦN. BÀI THI ĐÃ BỊ ĐÌNH CHỈ.');
        } else if (status === 'canceled') {
          alert('Đã hủy bài thi trắc nghiệm.');
        } else {
          alert(`Nộp bài thành công! Điểm trắc nghiệm: ${data.score}`);
        }
      } else if (submitMode === 'prac') {
        const formData = new FormData();
        formData.append('sbd', sbd);
        formData.append('subject', subject || '');
        formData.append('status', status || 'completed');
        if (uploadFile) formData.append('file', uploadFile);

        const res = await fetch('/api/submit_practical', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
          if (status === 'canceled') {
            alert('Đã hủy bài thi tự luận.');
          } else {
            alert('Đã nộp bài tự luận thành công!');
          }
        } else {
          throw new Error('Server error');
        }
      }
      await fetchStatus();
      setMode('selection');
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 uppercase leading-none">{subject}</h1>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {mode === 'quiz' ? 'Phần thi Trắc nghiệm' : 'Phần thi Tự luận'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-mono font-bold text-2xl border-2 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
              <Clock className="w-6 h-6" />
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowConfirm('cancel')}
                disabled={isSubmitting}
                className="bg-white hover:bg-slate-50 text-slate-600 font-bold px-6 py-3 rounded-xl border border-slate-200 transition-all flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                HỦY THI
              </button>
              <button 
                onClick={() => setShowConfirm('submit')}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                NỘP BÀI
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {mode === 'quiz' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3 space-y-8">
              {/* Progress Bar */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiến độ làm bài</span>
                  <span className="text-xs font-bold text-indigo-600">{Object.keys(userAns).length} / {questions.length} câu</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(Object.keys(userAns).length / questions.length) * 100}%` }}
                    className="h-full bg-indigo-600"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {questions[qIdx] && (
                  <motion.div
                    key={questions[qIdx].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-200 min-h-[500px] flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">
                          Câu hỏi {qIdx + 1}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                          {questions.length} Câu
                        </span>
                      </div>
                      <button 
                        onClick={() => setFlagged({ ...flagged, [questions[qIdx].id]: !flagged[questions[qIdx].id] })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${flagged[questions[qIdx].id] ? 'bg-orange-50 text-orange-600' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        {flagged[questions[qIdx].id] ? 'ĐÃ ĐÁNH DẤU' : 'ĐÁNH DẤU CÂU HỎI'}
                      </button>
                    </div>

                    <h3 className="text-3xl font-bold text-slate-900 mb-12 leading-tight">
                      {questions[qIdx].q}
                    </h3>
                    
                    <div className="space-y-4 mt-auto">
                      {questions[qIdx].opts.map((opt, i) => {
                        const isSelected = userAns[questions[qIdx].id] === opt;
                        const label = String.fromCharCode(65 + i); // A, B, C...
                        
                        return (
                          <button
                            key={i}
                            onClick={() => setUserAns({ ...userAns, [questions[qIdx].id]: opt })}
                            className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-6 group relative overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-600'}`}>
                              {label}
                            </div>
                            <span className={`text-lg font-semibold flex-1 ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                              {opt}
                            </span>
                            {isSelected && (
                              <motion.div 
                                layoutId="active-indicator"
                                className="absolute right-6"
                              >
                                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setQIdx(prev => Math.max(0, prev - 1))}
                  disabled={qIdx === 0}
                  className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-20 shadow-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                  CÂU TRƯỚC
                </button>
                
                <div className="flex gap-2">
                  {qIdx === questions.length - 1 ? (
                    <button 
                      onClick={() => setShowConfirm({ type: 'submit', mode: 'quiz' })}
                      className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      HOÀN THÀNH
                      <Send className="w-6 h-6" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setQIdx(prev => Math.min(questions.length - 1, prev + 1))}
                      className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      CÂU TIẾP THEO
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 h-fit sticky top-32">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Bản đồ câu hỏi</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {questions.map((q, i) => {
                    const isCurrent = qIdx === i;
                    const isAnswered = !!userAns[q.id];
                    const isFlagged = flagged[q.id];
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => setQIdx(i)}
                        className={`aspect-square rounded-xl font-bold text-sm transition-all flex items-center justify-center relative ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110 z-10' : ''} ${isAnswered ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        {i + 1}
                        {isAnswered && !isCurrent && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        )}
                        {isFlagged && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                            <AlertCircle className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-12 space-y-4 pt-8 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Đã trả lời</span>
                    <span className="text-indigo-600">{Object.keys(userAns).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Chưa trả lời</span>
                    <span className="text-slate-600">{questions.length - Object.keys(userAns).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Đã đánh dấu</span>
                    <span className="text-orange-600">{Object.keys(flagged).filter(k => flagged[Number(k)]).length}</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hướng dẫn</h5>
                  <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-3">
                    <li>Chọn đáp án và nhấn "Câu tiếp theo"</li>
                    <li>Sử dụng "Đánh dấu" cho các câu chưa chắc chắn</li>
                    <li>Hệ thống tự động nộp bài khi hết giờ</li>
                  </ul>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <button 
                    onClick={() => setShowConfirm({ type: 'cancel', mode: 'quiz' })}
                    className="w-full py-4 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Hủy bài thi
                  </button>
                </div>
              </div>

              {/* AI Status Card */}
              <div className="bg-indigo-900 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-widest">AI Monitoring</h4>
                </div>
                <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                  Hệ thống đang giám sát vị trí của bạn. Vui lòng không rời khỏi khung hình hoặc quay mặt đi quá lâu.
                </p>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Số lần vi phạm</span>
                  <span className={`text-xl font-black ${violations > 0 ? 'text-red-400' : 'text-white'}`}>{violations} / 3</span>
                </div>
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
                    onClick={() => setShowConfirm({ type: 'submit', mode: 'prac' })}
                    disabled={!uploadFile || isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all disabled:opacity-20 disabled:shadow-none"
                  >
                    XÁC NHẬN NỘP BÀI
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirm({ type: 'cancel', mode: 'prac' })}
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

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${showConfirm.type === 'submit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {showConfirm.type === 'submit' ? <Send className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {showConfirm.type === 'submit' ? 'Xác nhận nộp bài?' : 'Xác nhận hủy bài?'}
              </h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {showConfirm.type === 'submit' 
                  ? 'Bạn có chắc chắn muốn kết thúc bài thi và nộp kết quả ngay bây giờ không?' 
                  : 'Hành động này sẽ hủy bỏ toàn bộ kết quả bài thi hiện tại và không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?'}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  QUAY LẠI
                </button>
                <button
                  onClick={() => handleSubmit(showConfirm.mode, showConfirm.type === 'cancel' ? 'canceled' : undefined)}
                  className={`flex-1 py-4 text-white font-bold rounded-2xl transition-all shadow-lg ${showConfirm.type === 'submit' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
                >
                  XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
