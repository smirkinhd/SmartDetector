import { useLocation, useNavigate } from 'react-router-dom'; // Импортируем useNavigate для кнопки "Назад"
import './Result.css'; // Подключаем стили

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const videoUrl = params.get('videoUrl');

  return (
    <div className="result-container">
      <button 
        className="result-back-button" 
        onClick={() => navigate('/profile')} // Возвращаемся на главную страницу
      >
        Назад
      </button>
      <h1 className="result-title">Результаты обработки видео</h1>
      {videoUrl ? (
        <div className="result-video-container">
          <video className="result-video" controls>
            <source src={videoUrl} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      ) : (
        <p>Видео не найдено. Пожалуйста, попробуйте снова.</p>
      )}
    </div>
  );
};

export default Result;