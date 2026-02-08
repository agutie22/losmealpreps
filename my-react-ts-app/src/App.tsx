import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Customize from './pages/Customize';
import Consultation from './pages/Consultation';
import Plan from './pages/Plan';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import MobileFooter from './components/MobileFooter';
import './App.css';

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <CartDrawer />
          <div className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/customize" element={<Customize />} />
              <Route path="/consultation" element={<Consultation />} />
              <Route path="/plan" element={<Plan />} />
            </Routes>
          </div>
          <MobileFooter />
        </Router>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
