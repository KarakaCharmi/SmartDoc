import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { useToast } from "./ToastContext";
import { apiUrl } from "../config";

function Login({ onAuthSuccess = () => {} }) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    login: false,
    signup: false,
    confirm: false
  });

  const firstErrorRef = useRef(null);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e, type) => {
    const { name, value } = e.target;
    const setter = type === "login" ? setLoginData : setSignupData;
    setter((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  useEffect(() => {
    if (firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors]);

  const validateForm = (type) => {
    const newErrors = {};
    const data = type === "login" ? loginData : signupData;

    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Invalid email";

    if (!data.password.trim()) newErrors.password = "Password is required";
    else if (data.password.length < 6 || data.password.length > 30)
      newErrors.password = "Password must be 6–30 characters";

    if (type === "signup") {
      if (!data.username.trim()) newErrors.username = "Username is required";

      if (!data.confirmPassword.trim())
        newErrors.confirmPassword = "Confirm your password";
      else if (data.password !== data.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    const newErrors = validateForm(type);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload =
      type === "login"
        ? loginData
        : {
            name: signupData.username,
            email: signupData.email,
            password: signupData.password
          };

    const url =
      type === "login"
        ? apiUrl("/api/auth/login")
        : apiUrl("/api/auth/signup");

    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        if (type === "login") {
          const { token, user } = result;
          if (token) localStorage.setItem("token", token);
          if (user) localStorage.setItem("user", JSON.stringify(user));

          if (user && user.isAdmin) {
            showToast("Welcome Admin! Redirecting...", { type: "success" });
            setTimeout(() => navigate("/admin"), 1000);
          } else {
            showToast("Login successful", { type: "success" });
            onAuthSuccess(user || {});
          }

          setLoginData({ email: "", password: "" });
        } else {
          showToast("Signup successful! Please login.", { type: "success" });
          setSignupData({
            email: "",
            username: "",
            password: "",
            confirmPassword: ""
          });
          setIsLogin(true);
        }
      } else {
        showToast(result.message || "Authentication failed", {
          type: "error"
        });
      }
    } catch (err) {
      console.error("Auth error:", err);
      showToast("Server error", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getRef = (field) => (errors[field] ? firstErrorRef : null);

  return (
    <div className="auth-container">
      <div className="form-toggle">
        <button
          className={`toggle-btn ${isLogin ? "active" : ""}`}
          onClick={() => setIsLogin(true)}
        >
          Sign In
        </button>
        <button
          className={`toggle-btn ${!isLogin ? "active" : ""}`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>

      {isLogin && (
        <form onSubmit={(e) => handleSubmit(e, "login")}>
          <input
            ref={getRef("email")}
            type="email"
            name="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => handleChange(e, "login")}
          />

          <input
            ref={getRef("password")}
            type={showPassword.login ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) => handleChange(e, "login")}
          />

          <button type="button" onClick={() => togglePasswordVisibility("login")}>
            👁️
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Sign In"}
          </button>
        </form>
      )}

      {!isLogin && (
        <form onSubmit={(e) => handleSubmit(e, "signup")}>
          <input
            ref={getRef("username")}
            type="text"
            name="username"
            placeholder="Username"
            value={signupData.username}
            onChange={(e) => handleChange(e, "signup")}
          />

          <input
            ref={getRef("email")}
            type="email"
            name="email"
            placeholder="Email"
            value={signupData.email}
            onChange={(e) => handleChange(e, "signup")}
          />

          <input
            type={showPassword.signup ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={signupData.password}
            onChange={(e) => handleChange(e, "signup")}
          />

          <input
            type={showPassword.confirm ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={signupData.confirmPassword}
            onChange={(e) => handleChange(e, "signup")}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Create Account"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Login;