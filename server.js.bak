/*
  MiTV Pro - Backend (Postgres opcional, SQLite por defecto)
*/
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const PG = require('pg');        // pg client
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.APP_SECRET || 'CAMBIA_ESTA_CLAVE';
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + Math.round(Math.random()*9999) + path.extname(file.originalname);
    cb(null, name);
  }
});
const upload = multer({ storage });

// DB helper: if DATABASE_URL present, use Postgres, else SQLite
let db;
let isPostgres = !!process.env.DATABASE_URL;

async function initDB() {
  if (isPostgres) {
    const client = new PG.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
    await client.connect();
    db = {
      run: async (sql, params=[]) => client.query(sql, params),
      get: async (sql, params=[]) => {
        const r = await client.query(sql, params);
        return r.rows[0];
      },
      all: async (sql, params=[]) => {
        const r = await client.query(sql, params);
        return r.rows;
      }
    };
    await db.run(`CREATE TABLE IF NOT EXISTS resellers (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT
    );`);
    await db.run(`CREATE TABLE IF NOT EXISTS devices (
      id SERIAL PRIMARY KEY,
      mac TEXT UNIQUE,
      m3u_url TEXT,
      password TEXT,
      active INTEGER DEFAULT 0,
      expires_at TIMESTAMP
    );`);
  } else {
    db = await open({ filename: path.join(__dirname,'data.db'), driver: sqlite3.Database });
    await db.exec(`CREATE TABLE IF NOT EXISTS resellers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    );`);
    await db.exec(`CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mac TEXT UNIQUE,
      m3u_url TEXT,
      password TEXT,
      active INTEGER DEFAULT 0,
      expires_at TEXT
    );`);
  }

  // create admin default if not exists
  try {
    const admin = await db.get(isPostgres ? 'SELECT * FROM resellers WHERE username=$1' : 'SELECT * FROM resellers WHERE username=?', ['admin']);
    if (!admin) {
      const hash = bcrypt.hashSync('admin', 10);
      if (isPostgres) {
        await db.run('INSERT INTO resellers (username,password_hash) VALUES ($1,$2)', ['admin', hash]);
      } else {
        await db.run('INSERT INTO resellers (username,password_hash) VALUES (?,?)', ['admin', hash]);
      }
      console.log('Usuario admin creado: admin / admin');
    }
  } catch (err) {
    console.error('Error comprobando/creando admin:', err);
  }
}

function auth(req,res,next){
  const h = req.headers.authorization;
  if(!h) return res.status(401).json({error:'No token'});
  const token = h.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){
    res.status(401).json({error:'Token inválido'});
  }
}

// Endpoints
app.post('/api/auth/login', async (req,res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error:'Missing'});
  const u = await db.get(isPostgres ? 'SELECT * FROM resellers WHERE username=$1' : 'SELECT * FROM resellers WHERE username=?', [username]);
  if(!u) return res.status(400).json({error:'Credenciales inválidas'});
  if(!bcrypt.compareSync(password, u.password_hash)) return res.status(400).json({error:'Credenciales inválidas'});
  const token = jwt.sign({ id:u.id, username:u.username }, JWT_SECRET, { expiresIn:'7d' });
  res.json({ token });
});

app.post('/api/reseller/activate', auth, async (req,res) => {
  const { mac, password, duration_days, m3u_url } = req.body;
  if(!mac || !duration_days) return res.status(400).json({error:'Datos incompletos'});
  const expires = new Date();
  expires.setDate(expires.getDate() + Number(duration_days));
  const exists = await db.get(isPostgres ? 'SELECT * FROM devices WHERE mac=$1' : 'SELECT * FROM devices WHERE mac=?', [mac]);
  if(exists){
    if (isPostgres) {
      await db.run('UPDATE devices SET password=$1, m3u_url=$2, active=1, expires_at=$3 WHERE mac=$4',
        [password, m3u_url, expires.toISOString(), mac]);
    } else {
      await db.run('UPDATE devices SET password=?, m3u_url=?, active=1, expires_at=? WHERE mac=?',
        [password, m3u_url, 1, expires.toISOString(), mac]);
    }
  } else {
    if (isPostgres) {
      await db.run('INSERT INTO devices (mac,password,m3u_url,active,expires_at) VALUES ($1,$2,$3,$4,$5)',
        [mac, password, m3u_url, 1, expires.toISOString()]);
    } else {
      await db.run('INSERT INTO devices (mac,password,m3u_url,active,expires_at) VALUES (?,?,?,?,?)',
        [mac, password, m3u_url, 1, expires.toISOString()]);
    }
  }
  res.json({ ok:true, expires_at: expires.toISOString() });
});

app.post('/api/reseller/deactivate', auth, async (req,res) => {
  const { mac } = req.body;
  if(!mac) return res.status(400).json({error:'mac required'});
  if (isPostgres) await db.run('UPDATE devices SET active=0 WHERE mac=$1', [mac]); else await db.run('UPDATE devices SET active=0 WHERE mac=?', [mac]);
  res.json({ ok:true });
});

app.post('/api/reseller/uploadM3U', auth, upload.single('list'), async (req,res) => {
  if(!req.file) return res.status(400).json({error:'file required'});
  const url = '/uploads/' + req.file.filename;
  res.json({ ok:true, url });
});

app.get('/api/checkDevice', async (req,res) => {
  const mac = req.query.mac;
  if(!mac) return res.status(400).json({error:'mac required'});
  const d = await db.get(isPostgres ? 'SELECT * FROM devices WHERE mac=$1' : 'SELECT * FROM devices WHERE mac=?', [mac]);
  if(!d) return res.json({ active:false });
  const now = new Date();
  const expires = d.expires_at ? new Date(d.expires_at) : null;
  const active = d.active && expires && expires > now;
  res.json({ active: !!active, m3u_url: d.m3u_url || null, expires_at: d.expires_at });
});

app.get('/api/reseller/users', auth, async (req,res) => {
  const rows = await db.all(isPostgres ? 'SELECT mac,m3u_url,active,expires_at FROM devices ORDER BY id DESC' : 'SELECT mac,m3u_url,active,expires_at FROM devices ORDER BY id DESC');
  res.json({ users: rows });
});

app.use('/uploads', express.static(uploadDir));

initDB().then(()=> {
  app.listen(PORT, ()=> console.log('API escuchando en puerto', PORT));
}).catch(err=>{
  console.error('DB error', err);
});
