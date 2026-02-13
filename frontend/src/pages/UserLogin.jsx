import React, { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Flex, Heading, Link, Text, TextField } from "@radix-ui/themes";
import { loginUser } from "../services/auth.js";
import { useAuth } from "../auth/AuthContext.jsx";

function UserLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/home";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ username, password });
      login({ user: data.user, token: data.token });
      navigate(from, { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-page">
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="4">
          <Heading size="6">Log in</Heading>
          <Text size="2" color="gray">
            Please Log in to Continue
          </Text>

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
