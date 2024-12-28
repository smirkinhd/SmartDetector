import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Подключаем стили

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); // Сохраняем токен
        navigate('/profile'); // Переход на профиль
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Вход</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-button" type="submit">
          Войти
        </button>
      </form>
      {error && <p className="login-error">{error}</p>}

      {/* Кнопка для перехода на страницу регистрации */}
      <div className="switch-to-register">
        <p>Нет аккаунта? <button className="login-button" onClick={() => navigate('/register')}>Зарегистрируйтесь</button></p>
      </div>
    </div>
  );
};

export default Login;