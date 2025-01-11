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
  
    // Очистка предыдущих ошибок
    setError('');
  
    try {
      const response = await fetch('http://localhost:5040/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const text = await response.text();
        console.log('Error response text:', text);
        setError(text || 'Login failed');
        return;
      }
  
      const data = await response.json();
      console.log('Response Data:', data);
  
      if (!data.token) {
        console.error('Token is missing in server response');
        setError('Token is missing');
        return;
      }
  
      localStorage.setItem('token', data.token);
      console.log('Token saved to localStorage:', localStorage.getItem('token'));
  
      navigate('/profile');
    } catch (error) {
      setError('An error occurred during login');
      console.error('Login Error:', error);
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