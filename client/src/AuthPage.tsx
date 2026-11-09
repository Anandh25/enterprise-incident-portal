import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import "./AuthPage.css";
import toast from "react-hot-toast";

const API_URL = "https://enterprise-incident-portal.onrender.com/api/auth";

type AuthPageProps = {
  onLoginSuccess: () => void;
};

function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (signupPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post(`${API_URL}/register`, {
        name: name.trim(),
        email: email.trim(),
        password: signupPassword,
      });

      setMessageType("success");
      setMessage(response.data.message || "Account created! Please sign in.");
      toast.success("Account created successfully!");

      setLoginEmail(email.trim());
      setLoginPassword("");

      setName("");
      setEmail("");
      setSignupPassword("");
      setConfirmPassword("");

      setShowSignupPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        setIsSignUp(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      setMessageType("error");

      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      } else {
        setMessage("Something went wrong. Please try again.");
      }

      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      setIsLoading(true);

      const response = await axios.post(`${API_URL}/login`, {
        email: loginEmail.trim(),
        password: loginPassword,
      });

      const token = response.data.data?.token;

      if (!token) {
        throw new Error("Login response did not contain a token.");
      }

      localStorage.setItem("token", token);

      toast.success("Login successful!");

      onLoginSuccess();

      // Dashboard routing will be connected in the next step.
    } catch (error) {
      setMessageType("error");

      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            "Login failed. Please check your credentials.",
        );
      } else {
        setMessage("Something went wrong. Please try again.");
      }

      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((prev) => !prev);
    setMessage("");
  };

  return (
    <main className={`auth-page ${isSignUp ? "signup-mode" : ""}`}>
      <section className="auth-card">
        {/* Curved blue panel */}
        <div className="auth-panel">
          <div className="auth-brand">
            <span className="brand-icon">⬡</span>
            <span>
              Incident<span className="brand-light">Portal</span>
            </span>
          </div>

          <button
            className="panel-button"
            type="button"
            onClick={switchMode}
            disabled={isLoading}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {/* Authentication forms */}
        <div className="auth-forms">
          {/* Login form */}
          <form
            className={`auth-form login-form ${isSignUp ? "form-hidden" : ""}`}
            onSubmit={handleSignIn}
          >
            <h1>Login</h1>

            <input
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />

            <div className="password-field">
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                aria-label={
                  showLoginPassword ? "Hide password" : "Show password"
                }
              >
                {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="form-options">
              <label>
                <input type="checkbox" />
                Remember me
              </label>

              <button type="button" className="text-button">
                Forgot password?
              </button>
            </div>

            {message && !isSignUp && (
              <p className={`auth-message ${messageType}`} role="alert">
                {message}
              </p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Login"}
            </button>
          </form>

          {/* Sign Up form */}
          <form
            className={`auth-form signup-form ${isSignUp ? "" : "form-hidden"}`}
            onSubmit={handleSignUp}
          >
            <h1>Sign Up</h1>

            <input
              type="text"
              placeholder="Full name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="password-field">
              <input
                type={showSignupPassword ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowSignupPassword((prev) => !prev)}
                aria-label={
                  showSignupPassword ? "Hide password" : "Show password"
                }
              >
                {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {message && isSignUp && (
              <p className={`auth-message ${messageType}`} role="alert">
                {message}
              </p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
