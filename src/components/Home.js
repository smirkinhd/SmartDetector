import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Подключение файла со стилями

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1 className="home-title">Добро пожаловать</h1>
      <div className="home-buttons">
        <button className="home-button" onClick={() => navigate('/login')}>
          Войти
        </button>
        <button className="home-button" onClick={() => navigate('/register')}>
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}

export default Home;