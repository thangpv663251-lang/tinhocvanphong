import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ListTodo, 
  Settings, 
  Trash2, 
  Download, 
  Plus, 
  Save, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  FileText,
  Layout,
  Presentation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { toast } from 'react-hot-toast';

interface Result {
  id: number;
  sbd: string;
  subject: string;
  quiz_score: string;
  prac_score: string;
  prac_file: string;
  time_submit: string;
  violations: number;
}

interface QuizQuestion {
  id: number;
  subject: string;
  question: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  answer: string;
}

interface Student {
  sbd: string;
  fullname: string;
  dob: string;
  pob: string;
  course: string;
  phone: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'results' | 'quiz' | 'prac' | 'students' | 'settings'>('results');
  const [results, setResults] = useState<Result[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'results') {
        const res = await fetch('/api/admin/results');
        setResults(await res.json());
      } else if (activeTab === 'quiz') {
        const res = await fetch('/api/admin/get_all_quizzes');
        setQuizzes(await res.json());
      } else if (activeTab === 'students') {
        const res = await fetch('/api/admin/students');
        setStudents(await res.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetResults = async () => {
    if (!confirm('CẢNH BÁO: Xóa TOÀN BỘ kết quả thi? Hành động này không thể hoàn tác.')) return;
    await fetch('/api/admin/reset_results', { method: 'POST' });
    fetchData();
    toast.success('Đã xóa sạch kết quả thi.');
  };

  const handleResetAll = async () => {
    if (!confirm('CẢNH BÁO NGUY HIỂM: Xóa TOÀN BỘ thí sinh và kết quả?')) return;
    await fetch('/api/admin/reset_all', { method: 'POST' });
    fetchData();
    toast.success('Hệ thống đã được làm mới hoàn toàn.');
  };

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullname: '',
    dob: '',
    pob: '',
    course: 'Cơ bản',
    phone: ''
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/add_student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      if (res.ok) {
        setIsAddingStudent(false);
        setNewStudent({ fullname: '', dob: '', pob: '', course: 'Cơ bản', phone: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleDeleteStudent = async (sbd: string) => {
    if (!confirm('Xóa thí sinh này?')) return;
    await fetch(`/api/admin/del_student/${sbd}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteResult = async (id: number) => {
    if (!confirm('Xác nhận xóa kết quả này?')) return;
    await fetch(`/api/admin/delete_result/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleUpdateScore = async (id: number, score: string) => {
    await fetch('/api/admin/update_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, score })
    });
    fetchData();
  };

  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    subject: 'Word',
    question: '',
    opt_a: '',
    opt_b: '',
    opt_c: '',
    answer: ''
  });

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/add_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuiz)
      });
      if (res.ok) {
        setIsAddingQuiz(false);
        setNewQuiz({
          subject: 'Word',
          question: '',
          opt_a: '',
          opt_b: '',
          opt_c: '',
          answer: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding quiz:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">ADMIN PANEL</h1>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hệ thống quản trị</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <NavButton 
            active={activeTab === 'results'} 
            onClick={() => setActiveTab('results')}
            icon={Users}
            label="Kết quả thí sinh"
          />
          <NavButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
            icon={Users}
            label="Quản lý thí sinh"
          />
          <NavButton 
            active={activeTab === 'quiz'} 
            onClick={() => setActiveTab('quiz')}
            icon={ListTodo}
            label="Ngân hàng câu hỏi"
          />
          <NavButton 
            active={activeTab === 'prac'} 
            onClick={() => setActiveTab('prac')}
            icon={FileText}
            label="Cấu hình tự luận"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={Settings}
            label="Cài đặt hệ thống"
          />
        </nav>

        <div className="p-8 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Tổng thí sinh</p>
            <p className="text-2xl font-black text-slate-900">{results.length}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Kết quả thí sinh</h2>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  XUẤT BÁO CÁO
                </button>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">SBD</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Môn thi</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Trắc nghiệm</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Tự luận</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Vi phạm</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-mono font-bold text-indigo-600">{res.sbd}</td>
                        <td className="px-8 py-6 font-bold text-slate-900">{res.subject}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${res.quiz_score === 'HỦY/VI PHẠM' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {res.quiz_score || '-'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <input 
                              type="text" 
                              defaultValue={res.prac_score}
                              onBlur={(e) => handleUpdateScore(res.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {res.prac_file && res.prac_file !== 'HỦY BỎ' && (
                              <a 
                                href={`/api/download/${res.prac_file}`}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-widest"
                              >
                                Tải bài
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${res.violations > 0 ? 'text-red-500' : 'text-slate-200'}`} />
                            <span className={`font-bold ${res.violations > 0 ? 'text-red-600' : 'text-slate-400'}`}>{res.violations}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleDeleteResult(res.id)}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý thí sinh</h2>
                <button 
                  onClick={() => setIsAddingStudent(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  THÊM THÍ SINH
                </button>
              </div>

              <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">SBD (SĐT)</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Họ tên</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Ngày sinh</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Nơi sinh</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Khóa học</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((std) => (
                      <tr key={std.sbd} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-mono font-bold text-indigo-600">{std.sbd}</td>
                        <td className="px-8 py-6 font-bold text-slate-900">{std.fullname}</td>
                        <td className="px-8 py-6 text-slate-500">{std.dob}</td>
                        <td className="px-8 py-6 text-slate-500">{std.pob}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                            {std.course}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleDeleteStudent(std.sbd)}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Ngân hàng câu hỏi</h2>
                <button 
                  onClick={() => setIsAddingQuiz(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  THÊM CÂU HỎI
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {quizzes.map((q) => (
                  <div key={q.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex items-start justify-between group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {q.subject}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                          Đáp án: {q.answer}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-4">{q.question}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <Option label="A" value={q.opt_a} />
                        <Option label="B" value={q.opt_b} />
                        <Option label="C" value={q.opt_c} />
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (confirm('Xóa câu hỏi này?')) {
                          await fetch(`/api/admin/del_quiz/${q.id}`, { method: 'DELETE' });
                          fetchData();
                        }
                      }}
                      className="p-3 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'prac' && (
            <motion.div
              key="prac"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-12">Cấu hình tự luận</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PracConfigCard subject="Word" icon={FileText} color="blue" />
                <PracConfigCard subject="Excel" icon={Layout} color="emerald" />
                <PracConfigCard subject="PowerPoint" icon={Presentation} color="orange" />
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-12">Cài đặt hệ thống</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-orange-50 rounded-2xl">
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Xóa kết quả thi</h3>
                      <p className="text-sm text-slate-400">Xóa toàn bộ điểm số và file bài làm của thí sinh.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleResetResults}
                    className="w-full py-4 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white font-bold rounded-xl transition-all"
                  >
                    LÀM MỚI KẾT QUẢ
                  </button>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-50 rounded-2xl">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Xóa toàn bộ hệ thống</h3>
                      <p className="text-sm text-slate-400">Xóa sạch thí sinh và kết quả (Dùng cho kỳ thi mới).</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleResetAll}
                    className="w-full py-4 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-all"
                  >
                    RESET TOÀN BỘ
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Student Modal */}
        <AnimatePresence>
          {isAddingStudent && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Thêm thí sinh mới</h3>
                  <button onClick={() => setIsAddingStudent(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                <form onSubmit={handleAddStudent} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Họ và tên</label>
                      <input 
                        type="text" 
                        required
                        value={newStudent.fullname}
                        onChange={(e) => setNewStudent({ ...newStudent, fullname: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Số điện thoại (SBD)</label>
                      <input 
                        type="text" 
                        required
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ngày sinh</label>
                      <input 
                        type="date" 
                        required
                        value={newStudent.dob}
                        onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nơi sinh</label>
                      <input 
                        type="text" 
                        required
                        value={newStudent.pob}
                        onChange={(e) => setNewStudent({ ...newStudent, pob: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Khóa học</label>
                    <select 
                      value={newStudent.course}
                      onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Cơ bản">Khóa cơ bản</option>
                      <option value="Cơ bản đến nâng cao">Khóa cơ bản đến nâng cao</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
                  >
                    LƯU THÍ SINH
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Quiz Modal */}
        <AnimatePresence>
          {isAddingQuiz && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Thêm câu hỏi mới</h3>
                  <button onClick={() => setIsAddingQuiz(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                <form onSubmit={handleAddQuiz} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Môn thi</label>
                      <select 
                        value={newQuiz.subject}
                        onChange={(e) => setNewQuiz({ ...newQuiz, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Word">Word</option>
                        <option value="Excel">Excel</option>
                        <option value="PowerPoint">PowerPoint</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Đáp án đúng (Gõ nội dung chuẩn)</label>
                      <input 
                        type="text" 
                        required
                        value={newQuiz.answer}
                        onChange={(e) => setNewQuiz({ ...newQuiz, answer: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Câu hỏi</label>
                    <textarea 
                      required
                      rows={3}
                      value={newQuiz.question}
                      onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lựa chọn A</label>
                      <input 
                        type="text" 
                        required
                        value={newQuiz.opt_a}
                        onChange={(e) => setNewQuiz({ ...newQuiz, opt_a: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lựa chọn B</label>
                      <input 
                        type="text" 
                        required
                        value={newQuiz.opt_b}
                        onChange={(e) => setNewQuiz({ ...newQuiz, opt_b: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lựa chọn C</label>
                      <input 
                        type="text" 
                        required
                        value={newQuiz.opt_c}
                        onChange={(e) => setNewQuiz({ ...newQuiz, opt_c: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
                  >
                    LƯU CÂU HỎI
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
    >
      <Icon className="w-6 h-6" />
      {label}
    </button>
  );
}

function Option({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 h-6 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-bold">{label}</span>
      <span className="text-slate-600 truncate">{value}</span>
    </div>
  );
}

function PracConfigCard({ subject, icon: Icon, color }: { subject: string, icon: any, color: string }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [point, setPoint] = useState(0.5);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`/api/get_prac_content/${subject}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
      });
  }, [subject]);

  const handleSave = async () => {
    await fetch('/api/admin/update_prac', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, title, content, quiz_point: point })
    });

    if (file) {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('file', file);
      await fetch('/api/admin/upload_prac_task', {
        method: 'POST',
        body: formData
      });
    }
    toast.success(`Đã lưu cấu hình ${subject}`);
  };

  const colors: any = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    orange: 'text-orange-600 bg-orange-50'
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 flex flex-col">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-6">{subject}</h3>
      
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tiêu đề</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nội dung đề bài</label>
          <textarea 
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">File đề thi (.pdf)</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        LƯU CẤU HÌNH
      </button>
    </div>
  );
}
