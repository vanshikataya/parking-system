import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import BillingPage from './pages/BillingPage';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Parking — Prototype</h1>
        <nav>
          <Link to="/">User View</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<UserPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <small>Local prototype — data stored in browser localStorage</small>
      </footer>
    </div>
  );
}
