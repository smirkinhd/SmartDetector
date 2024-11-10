import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Добро пожаловать</h1>
      <button onClick={() => navigate('/login')}>Войти</button>
      <button onClick={() => navigate('/register')}>Зарегистрироваться</button>
    </div>
  );
}

export default Home;