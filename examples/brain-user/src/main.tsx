import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainApp } from './components/MainApp';
import { UserServiceProvider } from './utils/UserServiceContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserServiceProvider>
      <MainApp />
    </UserServiceProvider>
  </React.StrictMode>
);
