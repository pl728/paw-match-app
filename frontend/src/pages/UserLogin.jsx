import React, { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Flex, Heading, Link, Text, TextField } from "@radix-ui/themes";
import { loginUser, resendVerificationEmail } from "../services/auth.js";
import { useAuth } from "../auth/useAuth.js";

function UserLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/home";
  const verified = searchParams.get("verified") === "1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const data = await loginUser({ username, password });
      login({ user: data.user, token: data.token });
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setVerificationMessage("Verify your email before logging in. You can resend the verification email below.");
        return;
      }
      alert(err.message);
      setErrorMessage(err.message || "Could not log in.");
    }
  };

  const handleResendVerification = async () => {
    if (!username) {
      setVerificationMessage("Enter your username first, then resend the verification email.");
      return;
    }

    setResending(true);
    try {
      const data = await resendVerificationEmail({ username });
      setVerificationMessage(data.message || "Verification email sent.");
    } catch (err) {
      setVerificationMessage(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="4">
          <Heading size="6">Log in</Heading>
          <Text size="2" color="gray">
            {verified ? "Email verified. You can now log in." : "Please Log in to Continue"}
          </Text>
          {verificationMessage && (
            <Text size="2" color="gray">
              {verificationMessage}
            </Text>
          )}

          {errorMessage && (
            <div className="status-message error">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <Flex direction="column" gap="3">
              <TextField.Root
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextField.Root
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {verificationMessage && (
                <Button type="button" variant="soft" onClick={handleResendVerification} disabled={resending}>
                  {resending ? "Sending..." : "Resend verification email"}
                </Button>
              )}
              <Button type="submit">Log In</Button>
            </Flex>
          </form>

          <Text size="2">
            Don’t have an account?{" "}
            <Link asChild>
              <RouterLink to="/register">Register</RouterLink>
            </Link>
          </Text>
          <Link asChild size="2">
            <RouterLink to="/">Back to Home</RouterLink>
          </Link>
        </Flex>
      </Card>
    </div>
  );
}

export default UserLogin;