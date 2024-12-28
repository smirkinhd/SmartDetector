import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; // Подключаем стили

const Profile = () => {
  const [userData, setUserData] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [areas, setAreas] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Для кнопки выхода

  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Загрузка видео
  const handleVideoUpload = (event) => {
    setVideoFile(event.target.files[0]);
  };

  // Получение кадра из видео
  const handleOpenFrame = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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
    if (selectedPoints.length >= 3) {
      setAreas((prevAreas) => [...prevAreas, selectedPoints]);
      setSelectedPoints([]);
    } else {
      alert('Выберите как минимум 3 точки для создания области.');
    }
  };

  // Добавление точки на изображении
  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setSelectedPoints((prevPoints) => [...prevPoints, { x, y }]);
  };

  // Выход из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token'); // Удаляем токен из локального хранилища
    navigate('/'); // Перенаправление на главную страницу
  };

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
  }, [navigate]);

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
          Выберите файл
        </label>

        {videoFile && (
          <>
            <video
              ref={videoRef}
              src={URL.createObjectURL(videoFile)}
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
            {currentFrame && (
              <img
                src={currentFrame}
                alt="Кадр"
                onClick={handleImageClick}
                className="modal-image"
              />
            )}
            <p>Выбранные точки: {JSON.stringify(selectedPoints)}</p>
            <button onClick={handleAddArea}>Добавить область</button>
            <button onClick={handleCloseModal}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
