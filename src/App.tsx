import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Customize from './pages/Customize';
import Consultation from './pages/Consultation';
import Plan from './pages/Plan';
import Admin from './pages/Admin';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { MenuProvider } from './context/MenuContext';
import CartDrawer from './components/CartDrawer';
import MobileFooter from './components/MobileFooter';
import BundleBuilder from './pages/BundleBuilder';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';

function App() {
  return (
    <UserProvider>
      <MenuProvider>
        <CartProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <ScrollToTop />
            <Navbar />
            <CartDrawer />
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/customize" element={<Customize />} />
                <Route path="/consultation" element={<Consultation />} />
                <Route path="/plan" element={<Plan />} />
                <Route path="/build-bundle" element={<BundleBuilder />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </div>
            <Footer />
            <MobileFooter />
          </Router>
        </CartProvider>
      </MenuProvider>
    </UserProvider>
  );
}

export default App;
