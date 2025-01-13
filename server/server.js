const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool, Client } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'SmartDetector',
  user: 'postgres',
  password: '1234',
};

// Проверка и создание базы данных, если она отсутствует
async function initializeDatabase() {
  const client = new Client({ ...dbConfig, database: 'postgres' });
  await client.connect();
  try {
    const dbCheck = await client.query("SELECT 1 FROM pg_database WHERE datname = 'SmartDetector'");
    if (dbCheck.rowCount === 0) {
      console.log('Creating database SmartDetector...');
      await client.query('CREATE DATABASE "SmartDetector"');
      console.log('Database SmartDetector created successfully.');
    } else {
      console.log('Database SmartDetector already exists.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.end();
  }
}

// Проверка и создание таблиц
async function initializeTables() {
  const pool = new Pool({ ...dbConfig, database: 'SmartDetector' });
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS public."Users" (
      "ID" SERIAL PRIMARY KEY,
      "EMail" VARCHAR(255) NOT NULL UNIQUE,
      "Phone" VARCHAR(20),
      "Password" VARCHAR(255) NOT NULL
    );`);
    console.log('Table Users checked/created successfully.');
  } catch (error) {
    console.error('Error initializing tables:', error);
  } finally {
    await pool.end();
  }
}

// Инициализация базы данных и таблиц перед запуском сервера
(async () => {
  await initializeDatabase();
  await initializeTables();
})();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SmartDetector',
  user: 'postgres',
  password: '1234',
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log("Received token: ", token);
  if (!token) return res.status(401).send({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: 'Invalid token' });
    console.log(user);
    req.user = user;
    next();
  });
};

// Регистрация пользователя
app.post('/register', async (req, res) => {
  const { email, phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query('INSERT INTO public."Users"("EMail", "Phone", "Password") values ($1, $2, $3)', [email, phone, hashedPassword]);
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send({ error: 'User registration failed' });
  }
});

// Аутентификация пользователя
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM public."Users" WHERE "EMail" = $1', [email]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).send({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) return res.status(401).send({ error: 'Invalid credentials' });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).send({ error: 'Internal server error' });
    }
    console.log("Generated token for userId: ", user.ID);
    const token = jwt.sign({ userId: user.ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.send({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send({ error: 'Login failed' });
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('userId from token:', req.user.userId);
    const userResult = await pool.query('SELECT "EMail", "Phone" FROM public."Users" WHERE "ID" = $1', [parseInt(req.user.userId)]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).send({ error: 'User not found' });

    res.status(200).send({ email: user.EMail, phone: user.Phone });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch user profile' });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Конфигурация multer для сохранения файлов
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads')); // Папка для сохранения
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// Создаем папку "uploads", если её нет
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

app.post('/upload', upload.fields([{ name: 'video' }, { name: 'areas' }]), (req, res) => {
  try {
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const areasFile = req.files['areas'] ? req.files['areas'][0] : null;

    if (!videoFile || !areasFile) {
      return res.status(400).send({ error: 'Видео или JSON-файл не были переданы!' });
    }

    console.log('Видео сохранено как:', videoFile.path);
    console.log('JSON-файл сохранен как:', areasFile.path);

    // Печатаем путь, чтобы проверить его
    const outputVideoPath = path.join(__dirname, '../public', '2024-08-07 01-16-23 (1).mkv');
    console.log('Путь для перемещения видео:', outputVideoPath);  // Это для диагностики
    pathnew = './loads/2024-08-07 01-16-23 (1).mkv'
    // Перемещаем видео в папку public для доступности через HTTP
    if (fs.existsSync(pathnew))
    {
      fs.renameSync(pathnew, outputVideoPath);
    }

    // Проверим, был ли файл перемещен в public
    if (fs.existsSync(outputVideoPath)) {
      console.log('Видео успешно перемещено в public:', outputVideoPath);
    } else {
      console.log('Не удалось переместить видео в папку public!');
      return res.status(500).send({ error: 'Не удалось переместить видео в папку public' });
    }

    // Отправляем путь к видео в ответ
    res.send({
      message: 'Файлы успешно сохранены!',
      videoUrl: '/2024-08-07 01-16-23 (1).mkv',  // Отправляем правильный путь для доступа к видео
      excelUrl: `/Report.xlsx`
    });
  } catch (error) {
    console.error('Ошибка при сохранении файлов:', error);
    res.status(500).send({ error: 'Ошибка при обработке запроса.' });
  }
});

// Статический сервер для видео
app.use(express.static(path.join(__dirname, 'public')));




const PORT = process.env.PORT || 5040;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


