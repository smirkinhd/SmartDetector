import { useLocation, useNavigate } from 'react-router-dom';
import './Result.css';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const videoUrl = params.get('videoUrl');
  const excelUrl = params.get('excelUrl');

  const handleDownloadExcel = async () => {
    const downloadUrl = `http://localhost:5040/Import/${excelUrl}`;

    try {
      const response = await fetch(downloadUrl);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'Report.xlsx';
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Файл не найден. Обращались по ссылке: ${downloadUrl}`);
      }
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      alert('Произошла ошибка при попытке скачать файл.');
    }
  };

  return (
    <div className="result-container">
      <button className="result-back-button" onClick={() => navigate('/profile')}>
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
      {excelUrl && (
        <button className="result-download-button" onClick={handleDownloadExcel}>
          Скачать отчет
        </button>
      )}
    </div>
  );
};

export default Result; 