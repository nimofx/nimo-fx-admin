import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

const Login = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoBox}>
          <div style={styles.logo}>N</div>
        </div>

        <h2 style={styles.title}>NIMO FX Admin</h2>
        <p style={styles.subtitle}>Secure admin access panel</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>Only authorized admins can access this panel</p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #050505, #111827, #064e3b)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    padding: 34,
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    textAlign: "center",
  },
  logoBox: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "#000",
    color: "#00c853",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: "bold",
  },
  title: {
    margin: 0,
    color: "#111",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    color: "#666",
    fontSize: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    padding: "15px 16px",
    borderRadius: 14,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 15,
    background: "#f9fafb",
  },
  button: {
    marginTop: 8,
    padding: "15px 16px",
    borderRadius: 14,
    border: "none",
    background: "#00c853",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    cursor: "pointer",
  },
  footer: {
    marginTop: 22,
    fontSize: 12,
    color: "#777",
  },
};

export default Login;