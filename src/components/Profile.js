// Profile.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState({ email: '', phone: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Телефон:</strong> {userData.phone}</p>
        </>
      )}
    </div>
  );
};

export default Profile;
