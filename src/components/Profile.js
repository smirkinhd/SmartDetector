import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; // Подключаем стили


const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#808080']; // 10 цветов

const Profile = () => {
  const [userData, setUserData] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [areas, setAreas] = useState([]);
  const [oriAreas, oriSetAreas] = useState([]);
  const [oriSelectedPoints, oriSetSelectedPoints] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Для кнопки выхода
  const [isPageBlocked, setIsPageBlocked] = useState(false); // Для блокировки страницы
  const [uploadProgress, setUploadProgress] = useState(0); // Для отслеживания прогресса
  const [videoUrl, setVideoUrl] = useState(null); // Новый state для хранения URL
  const [originalVideoResolution, setOriginalVideoResolution] = useState({ width: 0, height: 0 });

  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Загрузка видео
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видео-файл!');
      return;
    }

    if (videoFile && videoFile.name === file.name) {
      return; // Если тот же файл выбран, ничего не делаем
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));  // Создаем URL для локального просмотра
  };

  const handleRunAlgorithm = async () => {
    setIsPageBlocked(true);
    setUploadProgress(0);
  
    const formattedAreas = oriAreas.map((area, index) => ({
      areaNumber: index + 1,
      coordinates: area,
    }));
  
    const jsonBlob = new Blob([JSON.stringify(formattedAreas)], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], 'areas.json');
  
    if (!videoFile) {
      alert('Пожалуйста, загрузите видео!');
      setIsPageBlocked(false);
      return;
    }
  
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('areas', jsonFile);
  
    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Ответ от сервера:', data);
  
        const videoUrl = data.videoUrl;
        const excelUrl = data.excelDownloadUrl;
        
        if (videoUrl && excelUrl) {
          const videoUrlWithCacheBuster = videoUrl + '?t=' + new Date().getTime();
          const excelUrlWithCacheBuster = excelUrl + '?t=' + new Date().getTime();
          setIsPageBlocked(false);
          handleCloseModal();
  
          navigate(`/result?videoUrl=${encodeURIComponent(videoUrlWithCacheBuster)}&excelUrl=${encodeURIComponent(excelUrlWithCacheBuster)}`);
        } else {
          alert('Ответ от сервера не содержит videoUrl');
          setIsPageBlocked(false);
        }
      } else {
        alert('Ошибка при отправке данных!');
        setIsPageBlocked(false);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при отправке данных на сервер.');
      setIsPageBlocked(false);
    }
  };


  // Получение кадра из видео
  const handleOpenFrame = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCurrentFrame(canvas.toDataURL('image/png'));
    setIsModalOpen(true);
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoints([]);
  };

  // Добавление области
  const handleAddArea = () => {
    if (areas.length >= 7) {
      alert('Максимум 7 областей разрешено.');
      return;
    }

    if (selectedPoints.length === 4 && oriSelectedPoints.length === 4) {
      setAreas((prevAreas) => [...prevAreas, selectedPoints]);
      oriSetAreas((prevAreas) => [...prevAreas, oriSelectedPoints]);
      setSelectedPoints([]);
      oriSetSelectedPoints([]);
    } else {
      alert('Выберите как минимум 4 точки для создания области.');
    }
  };

  // Добавление точки на изображении
  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect(); // Получаем размеры изображения на экране

    // Координаты клика относительно изображения на экране
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setSelectedPoints((prevPoints) => [...prevPoints, { x, y }]);


    const scaleX = videoRef.current.videoWidth / rect.width; // Коэффициент масштабирования по ширине
    const scaleY = videoRef.current.videoHeight / rect.height; // Коэффициент масштабирования по высоте
  
    // Преобразуем координаты в оригинальные размеры видео
    const orx = x * scaleX;
    const ory = y * scaleY;
  
    // Добавляем точку в список выбранных
    oriSetSelectedPoints((prevPoints) => [...prevPoints, { orx, ory }]);
    
  };

  // Выход из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token'); // Удаляем токен из локального хранилища
    navigate('/'); // Перенаправление на главную страницу
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        console.log('Video dimensions:', width, height);
  
        setOriginalVideoResolution({ width, height });
      };
    }
  }, [videoUrl]);


  // Получение данных профиля
  useEffect(() => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      navigate('/login'); // Перенаправление, если токен отсутствует
      return;
    }
  
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          setUserData({ email: data.email, phone: data.phone });
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Не удалось получить данные профиля.');
          navigate('/login');
        }
      } catch (error) {
        setError('Произошла ошибка при получении данных профиля.');
        console.error(error);
      }
    };
  
    fetchProfile();
  }, [navigate]); // Убираем videoFile из зависимостей

  return (
    <div className="profile-container">
      {/* Верхний блок с информацией пользователя */}
      <div className="profile-header">
        <div
          className="user-info"
          onClick={() => setIsDropdownVisible(!isDropdownVisible)}
        >
          <span>{userData.email}</span>
        </div>
        {isDropdownVisible && (
          <div className="dropdown-menu">
            <button onClick={handleLogout}>Выход</button>
          </div>
        )}
      </div>

      {/* Кнопка выбора файла */}
      <div className="file-upload-container">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          id="file-upload"
          className="file-upload-input"
        />
        <label htmlFor="file-upload" className="file-upload-button">
          {videoFile ? 'Изменить файл' : 'Выберите файл'}
        </label>

        {videoUrl && (
          <>
              <video
                ref={videoRef}
                src={videoUrl}  // Используем videoUrl для отображения
                controls
                className="video-preview"
              />
            <button onClick={handleOpenFrame} className="open-frame-button">
              Открыть кадр
            </button>
          </>
        )}
      </div>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <div className="content-container">
              <div className="image-container">
                {currentFrame && (
                  <div>
                    <img
                      src={currentFrame}
                      alt="Кадр"
                      onClick={handleImageClick}
                      className="modal-image"
                    />
                    <svg className="overlay">
                      {areas.map((area, index) => (
                        <React.Fragment key={index}>
                          {area.length > 2 ? (
                            // Отображение области
                            <polygon
                              points={area.map(point => `${point.x},${point.y}`).join(' ')}
                              fill={colors[index % colors.length]}
                              opacity="0.5"
                            />
                          ) : (
                            // Отображение линии между двумя точками
                            <line
                              x1={area[0].x}
                              y1={area[0].y}
                              x2={area[1].x}
                              y2={area[1].y}
                              stroke={colors[index % colors.length]}
                              strokeWidth="2"
                            />
                          )}
                        </React.Fragment>
                      ))}
                      {/* Отображение выбранных точек */}
                      {selectedPoints.map((point, index) => (
                        <circle key={index} cx={point.x} cy={point.y} r="5" fill="red" />
                      ))}
                    </svg>
                  </div>
                )}
              </div>
              <div className="right-panel">
                <h3>Области</h3>
                <ul>
                  {areas.map((area, index) => (
                    <li key={index}>
                      <strong>Область {index + 1}:</strong> {JSON.stringify(area)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="button-group">
              <button className="modal-button add-area" onClick={handleAddArea}>Добавить область</button>
              <button className="modal-button run-algorithm" onClick={handleRunAlgorithm}>Запустить алгоритм</button>
              <button className="modal-button close-modal" onClick={handleCloseModal}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      {isPageBlocked && (
        <div className="page-blocker">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p>Загрузка... {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
