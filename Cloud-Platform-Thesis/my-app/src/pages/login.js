import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cosmicAuth } from '../components/cosmic';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { token, user } = await cosmicAuth(email, password);

            localStorage.setItem('cosmic_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));

            navigate('/map'); // Redirect to profile after login
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Hide navbar if it's somehow still visible
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = 'none';

        return () => {
            // Restore navbar when leaving login page
            if (navbar) navbar.style.display = '';
        };
    }, []);

    return (
        <>
            <div className="login-parent">
                <div className="login-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="546" height="640" viewBox="0 0 546 640" fill="none">
                        <g filter="url(#filter0_f_3407_5363)">
                            <path d="M312.439 296.559C279.776 385.76 34.3468 464.156 -54.854 431.493C-144.055 398.83 106.646 261.685 139.309 172.484C171.972 83.2833 197.385 -82.0679 286.585 -49.4047C375.786 -16.7415 345.102 207.358 312.439 296.559Z" fill="url(#paint0_linear_3407_5363)" />
                        </g>
                        <defs>
                            <filter id="filter0_f_3407_5363" x="-273.934" y="-253.614" width="819.163" height="892.668" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_3407_5363" />
                            </filter>
                            <linearGradient id="paint0_linear_3407_5363" x1="268.365" y1="-56.0766" x2="72.7224" y2="478.209" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#99CA8D" />
                                <stop offset="1" stopColor="#9747FF" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="login-right">
                    <div className="login-right-head">
                        <h1>Login</h1>
                    </div>
                    <div className="login-right-form">
                        <form className="login-right-form-inputs" onSubmit={handleSubmit}>
                            <div className="login-right-form-inputs">

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder='Email'
                                    required
                                    disabled={isLoading}
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder='Password'
                                    required
                                    disabled={isLoading}
                                />
                                {error && <p className="error">{error}</p>}

                            </div>
                            <div className="login-right-form-control">
                                <button type='submit' disabled={isLoading} >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                                <p>
                                    Don't have one?
                                    <NavLink
                                        className='login-right-form-control-link'
                                        to='/createAccount'
                                    >
                                        Create one!
                                    </NavLink>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export { Login };