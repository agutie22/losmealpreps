import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo-transparent.png';
import './Navbar.css';

const Navbar = () => {
    const { toggleCart, totalItems } = useCart();
    const navigate = useNavigate();

    const handleBundlesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (window.location.pathname !== '/') {
            navigate('/', { state: { scrollToBundles: true } });
        } else {
            document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">
                    <img src={logo} alt="Los Meal Preps" className="navbar-logo" />
                </Link>
            </div>
            <div className="navbar-links">
                <a href="/#bundles" onClick={handleBundlesClick}>Meal Bundles</a>
                <NavLink to="/consultation" className={({ isActive }) => isActive ? 'active' : ''}>Free Consult</NavLink>
                <NavLink to="/plan" className={({ isActive }) => isActive ? 'active' : ''}>Order Tracker</NavLink>
                <button className="cart-btn" onClick={toggleCart}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span className="cart-badge">{totalItems}</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
