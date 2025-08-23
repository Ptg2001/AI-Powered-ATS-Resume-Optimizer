import { Link } from "react-router";
import { useAuth } from "~/contexts/AuthContext";

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                {isAuthenticated ? (
                    <>
                        <span className="text-dark-200 text-xs sm:text-sm md:text-base hidden sm:block">
                            Welcome, {user?.name}
                        </span>
                        <Link to="/upload" className="primary-button w-fit text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2">
                            Upload Resume
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-2 sm:px-3 md:px-4 py-2 text-red-600 hover:text-red-800 font-medium text-xs sm:text-sm md:text-base"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/auth" className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm md:text-base">
                            Sign In
                        </Link>
                        <Link to="/auth" className="primary-button w-fit text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2">
                            Get Started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;