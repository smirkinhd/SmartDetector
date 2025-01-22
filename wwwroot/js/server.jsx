const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: '127.0.0.1',
    port: 8080,
    database: 'SmartDetector',
    user: 'SA',
    password: 'avRK-LnF1n',
});

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
}));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Received token: ", token);
    if (!token) return res.status(401).send({ error: 'Token missing' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send({ error: 'Invalid token' });
        console.log(user); // Добавьте логирование, чтобы увидеть, что хранится в user
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

        // Проверка наличия переменной JWT_SECRET
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
        console.log('userId from token:', req.user.userId); // Логируем значение
        const userResult = await pool.query('SELECT "EMail", "Phone" FROM public."Users" WHERE "ID" = $1', [parseInt(req.user.userId)]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).send({ error: 'User not found' });

        res.status(200).send({ email: user.EMail, phone: user.Phone });
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch user profile' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});