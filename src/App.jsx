import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import Registrer from './pages/Registrer';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminMaterials from './pages/admin/AdminMaterials';
import AdminMachines from './pages/admin/AdminMachines';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminHistory from './pages/admin/AdminHistory';
import AdminReports from './pages/admin/AdminReports';
import AdminQr from './pages/admin/AdminQr';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-gray-50 min-h-screen print:bg-white">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/registrer" element={<Registrer />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="materialer" element={<AdminMaterials />} />
                <Route path="maskiner" element={<AdminMachines />} />
                <Route path="avdelinger" element={<AdminDepartments />} />
                <Route path="historikk" element={<AdminHistory />} />
                <Route path="rapporter" element={<AdminReports />} />
                <Route path="qr" element={<AdminQr />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
