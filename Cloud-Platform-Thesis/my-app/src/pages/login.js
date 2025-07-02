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
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Invalid email or password');
            }

            const { token, user } = await response.json();

            localStorage.setItem('cosmic_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));

            navigate('/map');
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
                    <div
                        className="login-gradient-animated"
                        style={{
                            position: 'absolute',
                            width: 325.28,
                            height: 568.98,
                            left: 115.64,
                            top: -112,
                            borderRadius: 50,
                            // Remove background, boxShadow, filter, and transform from here
                        }}
                    />

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
                                    className={error ? 'invalid' : ''}
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder='Password'
                                    required
                                    disabled={isLoading}
                                    className={error ? 'invalid' : ''}
                                />
                                {error && <p className="form-error">{error}</p>}

                            </div>
                            <div className="login-right-form-control">
                                <button type='submit' disabled={isLoading} >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                                {/*<p>
                                    Don't have one?
                                    <NavLink
                                        className='login-right-form-control-link'
                                        to='/createAccount'
                                    >
                                        Create one!
                                    </NavLink>
                                </p>*/}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export { Login };