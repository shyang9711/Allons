import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'react-datepicker/dist/react-datepicker.css';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import HostGroupPage from '../pages/HostGroupPage';  // Import AccompanyPage
import MainPage from '../pages/MainPage';  // Import MainPage
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';

function App() {
  return (
    <I18nextProvider>
        <Router>
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/hostgroup" element={<HostGroupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
        </Routes>
        </Router>

    </I18nextProvider>
  );
}

export default App;
