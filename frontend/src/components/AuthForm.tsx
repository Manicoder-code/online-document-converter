import React, { useState } from "react";

interface AuthFormProps {
  mode: "login" | "signup";
  onAuthSuccess: (token: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "signup" ? "/signup" : "/login";
      // Always use localhost for API calls
      const apiUrl = "http://localhost:8000";
      const res = await fetch(`${apiUrl}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Authentication failed");
      } else {
        if (mode === "login") {
          onAuthSuccess(data.access_token);
        } else {
          setError(null);
          alert("Signup successful! You can now log in.");
        }
      }
    } catch (err: any) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" style={{ maxWidth: 400, margin: "32px auto" }} onSubmit={handleSubmit}>
      <h2>{mode === "signup" ? "Sign Up" : "Login"}</h2>
      <div className="form-row">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="form-row">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button className="btn primary-btn" type="submit" disabled={loading}>
        {loading ? "Please wait..." : mode === "signup" ? "Sign Up" : "Login"}
      </button>
      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
    </form>
  );
};

export default AuthForm;

