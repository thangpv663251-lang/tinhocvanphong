import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_FOLDER = path.join(__dirname, 'uploads');
const PRAC_FILES = path.join(__dirname, 'prac_files');
const DB_PATH = path.join(__dirname, 'exam_data.db');

// Ensure directories exist
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
if (!fs.existsSync(PRAC_FILES)) fs.mkdirSync(PRAC_FILES, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    sbd TEXT PRIMARY KEY,
    password TEXT,
    fullname TEXT,
    dob TEXT,
    pob TEXT,
    course TEXT,
    phone TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sbd TEXT,
    subject TEXT,
    quiz_score TEXT,
    prac_score TEXT,
    prac_file TEXT,
    time_submit TEXT,
    violations INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    question TEXT,
    opt_a TEXT,
    opt_b TEXT,
    opt_c TEXT,
    answer TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS prac_questions (
    subject TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    file_name TEXT,
    quiz_point REAL
  )`);

  // Initialize default subjects
  const subjects = ["Word", "Excel", "PowerPoint"];
  subjects.forEach(sub => {
    db.run("INSERT OR IGNORE INTO prac_questions (subject, title, content, file_name, quiz_point) VALUES (?, ?, ?, ?, ?)",
      [sub, `Đề thi ${sub}`, "Nội dung chưa cập nhật", "", 0.5]);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => {
    const sbd = req.body.sbd || 'unknown';
    const subject = req.body.subject || 'unknown';
    cb(null, `${sbd}_${subject}_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

const pracStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRAC_FILES),
  filename: (req, file, cb) => {
    const subject = req.body.subject || 'unknown';
    cb(null, `DE_${subject}_${Date.now()}_${file.originalname}`);
  }
});

const uploadPrac = multer({ storage: pracStorage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Student Auth & Info
  app.post('/api/login', (req, res) => {
    const { sbd, password } = req.body;
    db.get("SELECT * FROM students WHERE sbd = ? AND password = ?", [sbd, password], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) res.json({ status: "success", student: row });
      else res.status(401).json({ error: "Sai số báo danh hoặc mật khẩu" });
    });
  });

  app.get('/api/student/:sbd', (req, res) => {
    const { sbd } = req.params;
    db.get("SELECT * FROM students WHERE sbd = ?", [sbd], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) res.json(row);
      else res.status(404).json({ error: "Không tìm thấy thí sinh" });
    });
  });

  // API Routes
  app.post('/api/get_status', (req, res) => {
    const { sbd } = req.body;
    db.all("SELECT subject, quiz_score, prac_score, prac_file FROM results WHERE sbd = ?", [sbd.toUpperCase()], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const status: any = {};
      rows.forEach((r: any) => {
        status[r.subject] = { quiz: r.quiz_score, prac: r.prac_score, prac_file: r.prac_file };
      });
      res.json(status);
    });
  });

  app.get('/api/get_questions/:subject', (req, res) => {
    const { subject } = req.params;
    db.all("SELECT id, question, opt_a, opt_b, opt_c FROM quiz_questions WHERE subject = ?", [subject], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map((r: any) => ({ id: r.id, q: r.question, opts: [r.opt_a, r.opt_b, r.opt_c] })));
    });
  });

  app.get('/api/get_prac_content/:subject', (req, res) => {
    const { subject } = req.params;
    db.get("SELECT title, content, file_name FROM prac_questions WHERE subject = ?", [subject], (err, row: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) res.json({ title: row.title, content: row.content, file: row.file_name });
      else res.status(404).json({ error: "Not found" });
    });
  });

  app.post('/api/submit_quiz', (req, res) => {
    const { sbd, subject, status, violations, answers } = req.body;
    const sbdUpper = sbd.toUpperCase();
    const timeNow = new Date().toLocaleString('vi-VN');
    const vilo = parseInt(violations || 0);

    if (status === 'canceled' || vilo >= 3) {
      const quizRes = "HỦY/VI PHẠM";
      db.get("SELECT id FROM results WHERE sbd = ? AND subject = ?", [sbdUpper, subject], (err, row: any) => {
        if (row) {
          db.run("UPDATE results SET quiz_score = ?, violations = ? WHERE id = ?", [quizRes, vilo, row.id], () => res.json({ status: "success", score: quizRes }));
        } else {
          db.run("INSERT INTO results (sbd, subject, quiz_score, prac_score, prac_file, time_submit, violations) VALUES (?,?,?,?,?,?,?)",
            [sbdUpper, subject, quizRes, "", "", timeNow, vilo], () => res.json({ status: "success", score: quizRes }));
        }
      });
    } else {
      db.get("SELECT quiz_point FROM prac_questions WHERE subject = ?", [subject], (err, pracRow: any) => {
        const pt = pracRow?.quiz_point || 0.5;
        db.all("SELECT id, answer FROM quiz_questions WHERE subject = ?", [subject], (err, dbQs) => {
          let score = 0;
          dbQs.forEach((q: any) => {
            if (String(answers[q.id]) === String(q.answer)) score++;
          });
          const penalty = 1 - (vilo * 0.3);
          const quizRes = (score * pt * Math.max(0, penalty)).toFixed(2);

          db.get("SELECT id FROM results WHERE sbd = ? AND subject = ?", [sbdUpper, subject], (err, row: any) => {
            if (row) {
              db.run("UPDATE results SET quiz_score = ?, violations = ? WHERE id = ?", [quizRes, vilo, row.id], () => res.json({ status: "success", score: quizRes }));
            } else {
              db.run("INSERT INTO results (sbd, subject, quiz_score, prac_score, prac_file, time_submit, violations) VALUES (?,?,?,?,?,?,?)",
                [sbdUpper, subject, quizRes, "", "", timeNow, vilo], () => res.json({ status: "success", score: quizRes }));
            }
          });
        });
      });
    }
  });

  app.post('/api/submit_practical', upload.single('file'), (req, res) => {
    const { sbd, subject, status } = req.body;
    const sbdUpper = sbd?.toUpperCase() || 'UNKNOWN';
    let fname = status === 'canceled' ? "HỦY BỎ" : "KHÔNG CÓ FILE";
    
    if (status !== 'canceled' && (req as any).file) {
      fname = (req as any).file.filename;
    }

    console.log(`Submitting practical for ${sbdUpper} - ${subject} - Status: ${status} - File: ${fname}`);

    db.get("SELECT id FROM results WHERE sbd = ? AND subject = ?", [sbdUpper, subject], (err, row: any) => {
      if (err) {
        console.error("Database error (get):", err.message);
        return res.status(500).json({ error: err.message });
      }
      
      const timeNow = new Date().toLocaleString('vi-VN');
      if (row) {
        db.run("UPDATE results SET prac_file = ?, time_submit = ? WHERE id = ?", [fname, timeNow, row.id], (err) => {
          if (err) {
            console.error("Database error (update):", err.message);
            return res.status(500).json({ error: err.message });
          }
          res.json({ status: "success", filename: fname });
        });
      } else {
        db.run("INSERT INTO results (sbd, subject, quiz_score, prac_score, prac_file, time_submit) VALUES (?,?,?,?,?,?)",
          [sbdUpper, subject, "", "", fname, timeNow], (err) => {
            if (err) {
              console.error("Database error (insert):", err.message);
              return res.status(500).json({ error: err.message });
            }
            res.json({ status: "success", filename: fname });
          });
      }
    });
  });

  // Admin Routes
  app.get('/api/admin/students', (req, res) => {
    db.all("SELECT * FROM students ORDER BY sbd ASC", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/admin/add_student', (req, res) => {
    const { fullname, dob, pob, course, phone } = req.body;
    const sbd = phone; // SBD is phone number
    const password = phone; // Password is phone number
    db.run("INSERT INTO students (sbd, password, fullname, dob, pob, course, phone) VALUES (?,?,?,?,?,?,?)",
      [sbd, password, fullname, dob, pob, course, phone], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "success" });
      });
  });

  app.delete('/api/admin/del_student/:sbd', (req, res) => {
    db.run("DELETE FROM students WHERE sbd = ?", [req.params.sbd], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "success" });
    });
  });

  app.get('/api/admin/results', (req, res) => {
    db.all("SELECT * FROM results ORDER BY id DESC", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post('/api/admin/update_prac', (req, res) => {
    const { subject, title, content, quiz_point } = req.body;
    db.run("UPDATE prac_questions SET title = ?, content = ?, quiz_point = ? WHERE subject = ?",
      [title, content, quiz_point, subject], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "success" });
      });
  });

  app.post('/api/admin/upload_prac_task', uploadPrac.single('file'), (req, res) => {
    const { subject } = req.body;
    if ((req as any).file) {
      db.run("UPDATE prac_questions SET file_name = ? WHERE subject = ?", [(req as any).file.filename, subject], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "success", filename: (req as any).file?.filename });
      });
    } else {
      res.status(400).json({ error: "No file uploaded" });
    }
  });

  app.post('/api/admin/add_quiz', (req, res) => {
    const { subject, question, opt_a, opt_b, opt_c, answer } = req.body;
    db.run("INSERT INTO quiz_questions (subject, question, opt_a, opt_b, opt_c, answer) VALUES (?,?,?,?,?,?)",
      [subject, question, opt_a, opt_b, opt_c, answer], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "success" });
      });
  });

  app.get('/api/admin/get_all_quizzes', (req, res) => {
    db.all("SELECT * FROM quiz_questions", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.delete('/api/admin/del_quiz/:id', (req, res) => {
    db.run("DELETE FROM quiz_questions WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "success" });
    });
  });

  app.post('/api/admin/update_score', (req, res) => {
    const { id, score } = req.body;
    db.run("UPDATE results SET prac_score = ? WHERE id = ?", [score, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "success" });
    });
  });

  app.delete('/api/admin/delete_result/:id', (req, res) => {
    db.run("DELETE FROM results WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "success" });
    });
  });

  app.get('/api/download/:f', (req, res) => res.download(path.join(UPLOAD_FOLDER, req.params.f)));
  app.get('/api/download_prac_file/:f', (req, res) => res.download(path.join(PRAC_FILES, req.params.f)));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
