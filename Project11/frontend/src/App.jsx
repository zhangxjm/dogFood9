import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import OwnerLayout from './layouts/OwnerLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/*" element={<OwnerLayout />} />
      <Route path="/" element={<Navigate to="/owner" replace />} />
    </Routes>
  );
}
