let apiBaseUrl = '';

export const loadConfig = async () => {
  try {
    const response = await fetch('/config.json');
    const config = await response.json();
    apiBaseUrl = config.apiBaseUrl;
    console.log('Config loaded:', config);
  } catch (error) {
    console.error('Failed to load config.json:', error);
  }
};

export const getApiBaseUrl = () => apiBaseUrl;
