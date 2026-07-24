import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import {
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Alert,
  Fade,
  Container,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LocalHospital as HospitalIcon,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
          `,
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Fade in={true} timeout={800}>
          <Card
            sx={{
              maxWidth: 420,
              mx: "auto",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(16px)",
              borderRadius: "16px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                p: 3,
                textAlign: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 1.5,
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <HospitalIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                SADEV
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Hospital Management System
              </Typography>
            </Box>

            {/* Form */}
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#333",
                  mb: 2.5,
                }}
              >
                Welcome Back
              </Typography>

              <form onSubmit={handleLogin}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  required
                  sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      background: alpha("#f8f9fa", 0.6),
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant="outlined"
                  required
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      background: alpha("#f8f9fa", 0.6),
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                          color="primary"
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Fade in={Boolean(error)}>
                    <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={!loading && <LoginIcon />}
                  sx={{
                    mt: 1,
                    py: 1.2,
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "0 6px 16px rgba(102, 126, 234, 0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                      boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
                    },
                  }}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              {/* Footer */}
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography variant="body2" color="textSecondary">
                  Secure login for healthcare professionals
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Decorative Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            filter: "blur(4px)",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "20%",
            right: "12%",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.06)",
            filter: "blur(6px)",
            zIndex: 0,
          }}
        />
      </Container>
    </Box>
  );
}

export default Login;
