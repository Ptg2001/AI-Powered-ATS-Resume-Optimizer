import { Link } from "react-router";
import { useAuth } from "~/contexts/AuthContext";

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="navbar mx-auto">
            <Link to="/">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gradient animate-fade-in-delay-2">RESUMIND</p>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {isAuthenticated ? (
                    <>
                        <span className="text-dark-200 text-xs sm:text-sm md:text-base hidden sm:block animate-fade-in-delay-2">
                            Welcome, {user?.name}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="primary-button w-fit text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2 button-hover animate-fade-in-delay-2"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/auth" className="primary-button w-fit text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2 button-hover animate-fade-in-delay-2">
                            Sign In
                        </Link>
                        <Link to="/auth" className="primary-button w-fit text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2 button-hover animate-fade-in-delay-2">
                            Get Started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;