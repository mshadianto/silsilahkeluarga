import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../silsilah-keluarga.jsx'

// Polyfill window.storage using localStorage for browser deployment
if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
    async delete(key) {
      localStorage.removeItem(key);
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
