import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css'; // Подключаем стили

function Register() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password }),
      });
      const data = await response.json();
      alert(data.message || 'Registration successful');

      // Перенаправляем на страницу входа после успешной регистрации
      if (response.ok) {
        navigate('/login');
      }
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Регистрация</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <input
          className="register-input"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="register-input"
          type="phone"
          placeholder="Телефон"
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="register-input"
          type="password"
          placeholder="Пароль"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="register-button" type="submit">
          Зарегистрироваться
        </button>
      </form>

      {/* Кнопка для перехода на страницу входа */}
      <div className="switch-to-login">
        <p>Уже есть аккаунт? <button className="register-button" onClick={() => navigate('/login')}>Войдите</button></p>
      </div>
    </div>
  );
}

export default Register;
