import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css'; // Подключаем стили
import { getApiBaseUrl } from '../config';

function Register() {
  const apiBaseUrl = getApiBaseUrl();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.includes('@')) return 'Введите корректный email';
    if (phone.length < 10) return 'Введите корректный номер телефона';
    if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      console.log({ email, phone, password }); // Для проверки отправляемых данных

      const response = await fetch(`${apiBaseUrl}/registration/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password }),
      });

      if (response.ok) {
        console.log('Переход в форму входа');
        navigate('/login');
      } else {
        const errorData = await response.json();
        console.error('Ошибка регистрации:', errorData);
        alert(errorData.message || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка подключения:', error);
      alert('Ошибка подключения. Проверьте сервер.');
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
          type="tel"
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

      <div className="switch-to-login">
        <p>Уже есть аккаунт?{' '}
          <button className="register-button" onClick={() => navigate('/login')}>
            Войдите
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
