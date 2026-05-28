// login.jsx - FIXED: Use Express + MongoDB Backend
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import logo from "../Images/HoopersFits.png";
import heroBg from "../Images/sapatos.jpg";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loginBoxRef = useRef(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetErrors, setResetErrors] = useState({});
  const [securityQuestions] = useState([
    "What is the name of your first pet?",
    "What is your mother's maiden name?",
    "What is the name of your father?",
    "What is the name of your first school?",
    "What city were you born in?",
    "What is your favorite childhood book?"
  ]);

  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [lockoutMessage, setLockoutMessage] = useState("");
  const [loginDisabled, setLoginDisabled] = useState(false);

  useEffect(() => {
    let interval;
    if (isLockedOut && lockoutRemaining > 0) {
      interval = setInterval(() => {
        setLockoutRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLockedOut(false);
            setLoginDisabled(false);
            setLockoutMessage("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} minute${mins > 1 ? "s" : ""} ${secs} second${secs !== 1 ? "s" : ""}`;
    }
    return `${secs} second${secs !== 1 ? "s" : ""}`;
  };

  // =====================================================
  // 🔥 FIXED handleLogin - Express + MongoDB Backend
  // =====================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isLockedOut) {
      return;
    }

    // 🔥 CHANGE 1: Use email instead of username
    const email = e.target.username.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
      setUsernameError("Please enter email");
      setPasswordError("Please enter password");
      return;
    }

    setUsernameError("");
    setPasswordError("");

    try {
      // 🔥 CHANGE 2: New Express Backend URL
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔥 CHANGE 3: Send email + password
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log("🔍 Login response:", data);

      // Check for lockout (if backend returns it)
      if (data.status === "locked") {
        setIsLockedOut(true);
        setLockoutRemaining(data.remaining_seconds);
        setLoginDisabled(true);
        return;
      }

      // 🔥 CHANGE 4: New success check - use response.ok
      if (response.ok) {
        // ✅ Extract user data from new response structure
        const dbRole = data.user.role || "buyer";
        
        // ✅ Convert to standard roles
        let role = "buyer"; // Default to buyer
        
        if (dbRole === "admin" || dbRole === "seller") {
          role = "seller";
        }

        const userId = data.user._id;
        const token = data.token;

        console.log("🔍 Setting session:", { id: userId, role: role, token: token });

        // ✅ Create session with token
        const session = { 
          id: userId, 
          role: role,
          token: token
        };

        // Clear old sessions
        localStorage.removeItem("buyer_session");
        localStorage.removeItem("seller_session");

        // ✅ Set correct session - FIXED SYNTAX HERE
        if (role === "seller") {
          localStorage.setItem("seller_session", JSON.stringify(session));
        } else {
          localStorage.setItem("buyer_session", JSON.stringify(session));
        }

        // Update AuthContext FIRST
        login(session);

        // THEN navigate
        if (role === "seller") {
          navigate("/seller_dashboard", { replace: true });
        } else {
          navigate("/buyer_home", { replace: true });
        }

      } else {
        // Handle error - backend returns { message: "..." }
        setPasswordError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setPasswordError("Connection failed. Is backend running on port 5000?");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const securityQuestion = e.target.securityQuestion.value;
    const securityAnswer = e.target.securityAnswer.value.trim();
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    setResetError("");
    setResetSuccess("");
    setResetErrors({});

    let newErrors = {};
    
    if (!securityQuestion) {
      newErrors.securityQuestion = "Please select a security question.";
    }
    
    if (securityAnswer.trim().length < 2) {
      newErrors.securityAnswer = "Security answer must be at least 2 characters.";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    
    if (!passwordRegex.test(newPassword)) {
      if (newPassword.length < 8) {
        newErrors.newPassword = "Password must be 8-20 characters";
      } else if (/[^A-Za-z0-9]/.test(newPassword)) {
        newErrors.newPassword = "No special characters allowed.";
      } else if (!/[a-z]/.test(newPassword)) {
        newErrors.newPassword = "Password should contain lowercase letters";
      } else if (!/[A-Z]/.test(newPassword)) {
        newErrors.newPassword = "Password should contain uppercase letters";
      } else if (!/\d/.test(newPassword)) {
        newErrors.newPassword = "Password should contain numerical digits";
      }
    }

    if (newErrors.newPassword) {
      newErrors.confirmPassword = newErrors.newPassword;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Password does not match";
    }

    setResetErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: username, 
          security_question: securityQuestion,
          security_answer: securityAnswer,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(data.message);
        e.target.reset();
        setTimeout(() => {
          setShowForgotPassword(false);
        }, 2000);
      } else {
        setResetError(data.message || "Reset failed");
      }
    } catch (error) {
      console.error("❌ Reset Error:", error);
      setResetError("Connection failed. Is backend running on port 5000?");
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setResetError("");
    setResetSuccess("");
    setResetErrors({});
  };

  const goRegister = () => {
    if (loginBoxRef.current) {
      loginBoxRef.current.classList.add("slide-out");
      setTimeout(() => {
        navigate("/register");
      }, 600);
    } else {
      navigate("/register");
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { width: 100vw; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; background-color: #000; color: #fff; overflow-x: hidden; }

        .hero { 
          position: relative; 
          width: 100vw; 
          min-height: 88vh;
          overflow: hidden; 
        }

        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 20px 50px; 
          position: absolute; 
          top: 0; 
          width: 100%; 
          z-index: 10; 
        }

        .logo { width: 100px; }

        .nav a { color: #fff; text-decoration: none; margin-left: 20px; font-size: 14px; }
        .nav a:hover { color: #dc3545; }

        .hero::before {
          content: "";
          position: absolute;
          top: -10%;
          left: -5%;
          width: 110%;
          height: 130%;
          background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${heroBg}) no-repeat center center / cover;
          transform: skewY(-5deg);
          transform-origin: top left;
          z-index: 1;
        }

        .hero-content { 
          position: relative; 
          z-index: 2; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          min-height: 88vh; 
          padding: 0 80px; 
        }

        .text-section h2 { font-size: 38px; margin: 0; text-transform: uppercase; }
        .text-section h2:first-child { color: #dc3545; }

        .login-section { 
          width: 360px; 
          height: 400px;
          background: rgba(255,255,255,0.95); 
          color: #333; 
          border-radius: 12px; 
          padding: 20px; 
          backdrop-filter: blur(6px);
          display: flex;
          flex-direction: column;
          transition: all 0.4s ease;
          overflow: hidden;
        }

        .form-scroll { 
          flex: 1; 
          overflow-y: auto; 
          padding-right: 5px;
          scrollbar-width: thin;
          scrollbar-color: #ccc transparent;
        }
        .form-scroll::-webkit-scrollbar { width: 4px; }
        .form-scroll::-webkit-scrollbar-track { background: transparent; }
        .form-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

        .login-tabs { display: flex; justify-content: space-around; margin-bottom: 10px; }
        .login-tabs button { 
          background: none; 
          border: none; 
          font-size: 16px; 
          padding: 10px; 
          cursor: pointer; 
          border-bottom: 2px solid transparent; 
        }
        .login-tabs button.active { border-color: #dc3545; color: #dc3545; font-weight: 600; }

        .form-group { margin-bottom: 12px; }
        .form-group label { font-size: 14px; margin-bottom: 5px; display: block; font-weight: 500; }
        .form-group input, .form-group select { 
          width: 100%; 
          padding: 10px; 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          font-size: 14px;
        }
        .form-group select { cursor: pointer; }
        .form-group input.error, .form-group input.error-input { 
          border-color: red !important; 
          box-shadow: 0 0 5px rgba(255,0,0,0.3); 
        }

        .tooltip { 
          margin-left: 6px; 
          cursor: pointer; 
          color: #dc3545; 
          font-weight: bold; 
          font-size: 14px;
        }

        .error-text { color: red; font-size: 13px; margin-top: 5px; }
        .success-text { color: green; font-size: 13px; margin-top: 5px; }
        
        .lockout-text { 
          color: #dc3545; 
          font-size: 13px; 
          margin-top: 5px; 
          text-align: center;
          padding: 10px;
          background: rgba(220, 53, 69, 0.1);
          border-radius: 4px;
          border: 1px solid #dc3545;
        }

        .login-button, .reset-button { 
          width: 100%; 
          background-color: #dc3545; 
          color: #fff; 
          padding: 12px; 
          border: none; 
          border-radius: 20px; 
          cursor: pointer; 
          margin-top: 5px; 
          font-size: 16px; 
          font-weight: 600;
        }
        .login-button:hover, .reset-button:hover { background-color: #b02a37; }
        
        .login-button:disabled, .reset-button:disabled {
          background-color: #999;
          cursor: not-allowed;
        }

        .forgot-password { text-align: center; margin-top: 10px; }
        .forgot-password a { color: #777; font-size: 13px; text-decoration: none; cursor: pointer; }
        .forgot-password a:hover { color: #dc3545; }

        .slide-out { animation: slideOut 0.6s ease forwards; }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

        .footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 50px; font-size: 12px; }
        .footer-link { color: #fff; text-decoration: none; margin: 0 5px; }
        .footer-link:hover { color: #dc3545; }

        .social-icons a img { width: 20px; margin-left: 10px; transition: transform 0.3s ease, filter 0.3s ease; }
        .social-icons a:hover img { transform: scale(1.2); filter: brightness(1.5); }

        @media (max-width: 900px) { 
          .hero-content { flex-direction: column; text-align: center; } 
          .login-section { margin-top: 30px; width: 90%; max-width: 360px; } 
        }
      `}</style>

            <section className="hero">
        <div className="header">
          <img src={logo} className="logo" alt="Hoopers Fits Logo" />
          <nav className="nav">
            <a href="#">HOME</a>
            <a href="#">PRODUCT</a>
            <a href="#">ABOUT</a>
            <a href="#">CONTACT</a>
          </nav>
        </div>

        <div className="hero-content">
          <div className="text-section">
            <h2>ELEVATE YOUR GAME</h2>
            <h2>ELEVATE YOUR FIT</h2>
          </div>

          <div className="login-section" ref={loginBoxRef}>
            {!showForgotPassword ? (
              <>
                <div className="login-tabs">
                  <button className="active">Login</button>
                  <button onClick={goRegister}>Register</button>
                </div>

                <form className="form-scroll" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      name="username"
                      type="email"
                      required
                      className={usernameError ? "error" : ""}
                      disabled={isLockedOut}
                    />
                    {usernameError && <div className="error-text">{usernameError}</div>}
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      name="password"
                      type="password"
                      required
                      className={passwordError ? "error" : ""}
                      disabled={isLockedOut}
                    />
                    {passwordError && <div className="error-text">{passwordError}</div>}
                  </div>

                  {isLockedOut && lockoutMessage && (
                    <div className="lockout-text">
                      🔒 {lockoutMessage}<br />
                      ⏱️ Please wait: {formatTime(lockoutRemaining)}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLockedOut || loginDisabled}
                  >
                    {isLockedOut ? `Locked (${formatTime(lockoutRemaining)})` : "Login"}
                  </button>
                </form>

                <div className="forgot-password">
                  <a onClick={toggleForgotPassword}>Forgot password?</a>
                </div>
              </>
            ) : (
              <>
                <div className="login-tabs">
                  <button className="active" onClick={toggleForgotPassword}>← Back</button>
                  <button onClick={goRegister}>Register</button>
                </div>

                <form className="form-scroll" onSubmit={handlePasswordReset}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      name="username"
                      type="email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Security Question</label>
                    <select 
                      name="securityQuestion" 
                      required
                      style={{marginBottom: '5px'}}
                    >
                      <option value="">Select your security question</option>
                      {securityQuestions.map((question, index) => (
                        <option key={index} value={question}>{question}</option>
                      ))}
                    </select>
                    {resetErrors.securityQuestion && <div className="error-text">{resetErrors.securityQuestion}</div>}
                  </div>

                  <div className="form-group">
                    <label>Security Answer<span className="tooltip" title="Answer to your security question">?</span></label>
                    <input
                      name="securityAnswer"
                      type="text"
                      className={resetErrors.securityAnswer ? "error-input" : ""}
                      required
                    />
                    {resetErrors.securityAnswer && <div className="error-text">{resetErrors.securityAnswer}</div>}
                  </div>

                  <div className="form-group">
                    <label>New Password<span className="tooltip" title="8-20 characters with uppercase, lowercase, and number. No special characters">?</span></label>
                    <input
                      name="newPassword"
                      type="password"
                      required
                      className={resetErrors.newPassword ? "error-input" : ""}
                    />
                    {resetErrors.newPassword && <div className="error-text">{resetErrors.newPassword}</div>}
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      className={resetErrors.confirmPassword ? "error-input" : ""}
                    />
                    {resetErrors.confirmPassword && <div className="error-text">{resetErrors.confirmPassword}</div>}
                  </div>

                  {resetError && <div className="error-text">{resetError}</div>}
                  {resetSuccess && <div className="success-text">{resetSuccess}</div>}

                  <button type="submit" className="reset-button">Reset Password</button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>
          <a href="/privacy" className="footer-link">Privacy Policy</a> |
          <a href="/terms" className="footer-link">Terms & Conditions</a>
        </p>
        <div>
          Follow us on:
          <span className="social-icons">
            <a href="https://www.facebook.com/share/1as5kdEkMr/" target="_blank" rel="noopener noreferrer">
              <img src={facebookIcon} alt="Facebook" />
            </a>
            <a href="https://www.instagram.com/hoopersfits.ph?igsh=ZTFtNmw1YTR0OGZ6" target="_blank" rel="noopener noreferrer">
              <img src={instagramIcon} alt="Instagram" />
            </a>
          </span>
        </div>
      </footer>
    </>
  );
};

export default Login;