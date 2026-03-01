import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// 🔧 Fix ResizeObserver loop error
const ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class extends ResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);