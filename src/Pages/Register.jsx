// register.jsx - OPTION A: Simple Registration (with security question)
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../Images/HoopersFits.png";
import heroBg from "../Images/sapatos.jpg";
import facebookIcon from "../Images/facebook.png";
import instagramIcon from "../Images/Instagram.png";

const Register = () => {
  const navigate = useNavigate();
  const registerBoxRef = useRef(null);
  const [errors, setErrors] = useState({});

  // ✅ Security Questions (same as login.jsx)
  const [securityQuestions] = useState([
    "What is the name of your first pet?",
    "What is your mother's maiden name?",
    "What is the name of your father?",
    "What is the name of your first school?",
    "What city were you born in?",
    "What is your favorite childhood book?"
  ]);

  // ✅ STEP 1 - Add new state
  const [formData, setFormData] = useState({
    fullName: "",
    month: "",
    day: "",
    year: "",
    address: "",
    security_question: "",
    security_answer: ""
  });

  // ✅ STEP 2 - Add date logic
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = 2026;

  const years = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, i) => 1900 + i
  );

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return 31;
    return new Date(year, months.indexOf(month) + 1, 0).getDate();
  };

  const usernameRegex = /^(?=.*[A-Z])[A-Za-z0-9]{6,15}$/;

  const goLogin = () => {
    if (registerBoxRef.current) {
      registerBoxRef.current.classList.add("slide-out");
      setTimeout(() => {
        navigate("/login");
      }, 600);
    } else {
      navigate("/login");
    }
  };

  const validate = (username, password, confirmPassword) => {
    let newErrors = {};

    if (!usernameRegex.test(username)) {
      if (/[^A-Za-z0-9]/.test(username)) {
        newErrors.username = "No special characters allowed.";
      } else if (!/[A-Z]/.test(username)) {
        newErrors.username = "Username must contain at least one uppercase letter.";
      } else {
        newErrors.username = "Username must be 6-15 characters.";
      }
    }

    if (password.length <= 7) {
      newErrors.password = "Password is too weak";
    } 
    else if (/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "No special characters allowed.";
    } 
    else if (/^\d+$/.test(password)) {
      newErrors.password = "Password should contain uppercase and lowercase letters";
    } 
    else if (!/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)) {
      newErrors.password = "Password should contain lowercase letters";
    } 
    else if (!/[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)) {
      newErrors.password = "Password should contain uppercase letters";
    } 
    else if (!/\d/.test(password)) {
      newErrors.password = "Password should contain numerical digits";
    }

    if (newErrors.password) {
      newErrors.confirmPassword = newErrors.password;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Password does not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ STEP 3 - Add handler
  const handleChangeExtra = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // =====================================================
  // 🔥 handleRegister - UPDATED with extra fields + security question
  // =====================================================
  const handleRegister = async (e) => {
    e.preventDefault();

    const username = e.target.username.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (!validate(username, password, confirmPassword)) return;

    try {
      // ✅ FIXED: Use Production URL
      const response = await fetch("https://hooper-renderv1-4.onrender.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ STEP 4 - Updated body with extra fields + security question
        body: JSON.stringify({
          username,
          email,
          password,
          role: "buyer",

          fullName: formData.fullName,
          birthday: {
            month: formData.month,
            day: formData.day,
            year: formData.year
          },
          address: formData.address,
          security_question: formData.security_question,
          security_answer: formData.security_answer
        }),
      });

      const data = await response.json();
      console.log("🔍 Registration response:", data);

      if (response.ok) {
        alert("Registration Successful!");
        
        if (registerBoxRef.current) {
          registerBoxRef.current.classList.add("slide-out");
        }
        
        setTimeout(() => {
          navigate("/login");
        }, 600);
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      alert("Server error - please check your internet connection.");
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

        .register-section {
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
        .form-group label { font-size: 14px; display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input, .form-group select { 
          width: 100%; 
          padding: 10px; 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          font-size: 14px;
          background: #fff;
        }
        .form-group select { cursor: pointer; }

        /* ✅ Birthday select - 3 in a row */
        .form-group.birthday select {
          width: 32%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: #fff;
        }
        .form-group.birthday select:disabled {
          background: #f0f0f0;
          cursor: not-allowed;
        }

        .login-button {
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
        .login-button:hover { background-color: #b02a37; }

        .slide-out { animation: slideOut 0.6s ease forwards; }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 50px;
          font-size: 12px;
        }
        .footer-link { color: #fff; text-decoration: none; margin: 0 5px; }
        .footer-link:hover { color: #dc3545; }

        .social-icons a img {
          width: 20px;
          margin-left: 10px;
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        .social-icons a:hover img { transform: scale(1.2); filter: brightness(1.5); }

        .error-input { border: 2px solid red !important; box-shadow: 0 0 6px red; }
        .error-text { color: red; font-size: 12px; margin-top: 3px; }

        .tooltip { margin-left: 6px; cursor: pointer; color: #555; font-weight: bold; }

        @media (max-width: 900px) {
          .hero-content { flex-direction: column; text-align: center; }
          .register-section { margin-top: 30px; width: 90%; max-width: 360px; }
        }
      `}</style>

      <section className="hero">
        <div className="header">
          <img src={logo} className="logo" alt="Hoopers Fits Logo" />
          <nav className="nav">
            <a href="/login">HOME</a>
            <a href="/login">PRODUCT</a>
            <a href="/login">ABOUT</a>
            <a href="/login">CONTACT</a>
          </nav>
        </div>

        <div className="hero-content">
          <div className="text-section">
            <h2>ELEVATE YOUR GAME</h2>
            <h2>ELEVATE YOUR FIT</h2>
          </div>

          <div className="register-section" ref={registerBoxRef}>
            <div className="login-tabs">
              <button onClick={goLogin}>Login</button>
              <button className="active">Register</button>
            </div>

            <form className="form-scroll" onSubmit={handleRegister}>
              <div className="form-group">
                <label>Username<span className="tooltip" title="6-15 characters, one uppercase, no special characters">?</span></label>
                <input name="username" type="text" className={errors.username ? "error-input" : ""} required />
                {errors.username && <div className="error-text">{errors.username}</div>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" required />
              </div>

              {/* ✅ FULL NAME */}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChangeExtra}
                  required
                />
              </div>

              {/* ✅ BIRTHDAY (SMART DROPDOWNS) */}
              <div className="form-group birthday">
                <label>Birthday</label>

                {/* Month */}
                <select
                  name="month"
                  value={formData.month}
                  onChange={(e) => {
                    setFormData({ ...formData, month: e.target.value, day: "" });
                  }}
                  required
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Day */}
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChangeExtra}
                  disabled={!formData.month || !formData.year}
                  required
                >
                  <option value="">Day</option>
                  {Array.from(
                    { length: getDaysInMonth(formData.month, formData.year) },
                    (_, i) => i + 1
                  ).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Year */}
                <select
                  name="year"
                  value={formData.year}
                  onChange={(e) => {
                    setFormData({ ...formData, year: e.target.value, day: "" });
                  }}
                  required
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* ✅ ADDRESS */}
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChangeExtra}
                  required
                />
              </div>

              {/* ✅ SECURITY QUESTION (full width) */}
              <div className="form-group">
                <label>Security Question<span className="tooltip" title="Used for password reset">?</span></label>
                <select 
                  name="security_question" 
                  value={formData.security_question}
                  onChange={handleChangeExtra}
                >
                  <option value="">Select a security question (optional)</option>
                  {securityQuestions.map((question, index) => (
                    <option key={index} value={question}>{question}</option>
                  ))}
                </select>
              </div>

              {/* ✅ SECURITY ANSWER */}
              {formData.security_question && (
                <div className="form-group">
                  <label>Security Answer<span className="tooltip" title="Answer to your security question">?</span></label>
                  <input
                    type="text"
                    name="security_answer"
                    value={formData.security_answer}
                    onChange={handleChangeExtra}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Password<span className="tooltip" title="8-20 characters with uppercase, lowercase, and number. No special characters">?</span></label>
                <input name="password" type="password" className={errors.password ? "error-input" : ""} required />
                {errors.password && <div className="error-text">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input name="confirmPassword" type="password" className={errors.confirmPassword ? "error-input" : ""} required />
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
              </div>

              <button type="submit" className="login-button">Register</button>
            </form>
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

export default Register;