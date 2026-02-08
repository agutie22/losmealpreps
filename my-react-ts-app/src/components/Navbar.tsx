import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
    const { toggleCart, totalItems } = useCart();

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                Los Meal Preps
            </div>
            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/customize">Customize</Link>
                <Link to="/plan">Plan</Link>
                <button className="cart-btn" onClick={toggleCart}>
                    🛒 <span className="cart-badge">{totalItems}</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
