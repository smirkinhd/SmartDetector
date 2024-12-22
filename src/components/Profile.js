// Profile.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modal.css'; // Добавляем стили для всплывающего окна

const Profile = () => {
  const [userData, setUserData] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [areas, setAreas] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Обработчик загрузки видео
  const handleVideoUpload = (event) => {
    setVideoFile(event.target.files[0]);
  };

  // Открытие модального окна с текущим кадром
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

  // Добавление выбранной области
  const handleAddArea = () => {
    if (selectedPoints.length >= 3) {
      setAreas((prevAreas) => [...prevAreas, selectedPoints]);
      setSelectedPoints([]);
    } else {
      alert('Please select at least 3 points to create an area');
    }
  };

  // Добавление точки при клике на изображение в модальном окне
  const handleImageClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setSelectedPoints((prevPoints) => [...prevPoints, { x, y }]);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login'); // Перенаправление на страницу входа, если токен отсутствует
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
          setError(errorData.error || 'Failed to fetch profile data');
          navigate('/login'); // Перенаправление на страницу входа при ошибке
        }
      } catch (error) {
        setError('An error occurred while fetching profile data');
        console.error(error);
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div>
      <h1>Личный кабинет</h1>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Телефон:</strong> {userData.phone}</p>

      <div>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        {videoFile && (
          <>
            <video
              ref={videoRef}
              src={URL.createObjectURL(videoFile)}
              controls
              style={{ width: '100%', border: '1px solid black' }}
            />
            <button onClick={handleOpenFrame}>Открыть кадр</button>
          </>
        )}
      </div>

      <div>
        <h2>Выбранные области</h2>
        {areas.map((area, index) => (
          <div key={index}>
            <p>Область {index + 1}:</p>
            <pre>{JSON.stringify(area, null, 2)}</pre>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            {currentFrame && (
              <img
                src={currentFrame}
                alt="Current Frame"
                onClick={handleImageClick}
                style={{ maxWidth: '100%', cursor: 'crosshair' }}
              />
            )}
            <p>Выбранные точки: {JSON.stringify(selectedPoints)}</p>
            <button onClick={handleAddArea}>Добавить область</button>
            <button onClick={handleCloseModal}>Закончить</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
