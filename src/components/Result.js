import { useLocation } from 'react-router-dom'; // Импортируем хук для работы с URL-параметрами

const Result = () => {
  // Получаем параметры из URL
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const videoUrl = params.get('videoUrl'); // Извлекаем videoUrl из параметров

  return (
    <div>
      <h1>Результаты обработки видео</h1>
      {videoUrl ? (
        <div>
          <video controls width="100%" height="auto">
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