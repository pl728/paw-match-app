import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Card, Flex, Heading, Link, Select, Text, TextField } from "@radix-ui/themes";
import { registerUser } from "../services/auth.js";
import { useAuth } from "../auth/useAuth.js";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("adopter");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const data = await registerUser({ username, email, password, role });
      login({ user: data.user, token: data.token });
      navigate("/home", { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-page">
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="4">
          <Heading size="6">Create your account</Heading>
          <Text size="2" color="gray">
            Registration form placeholder. We will add verification and profile setup next.
          </Text>

          <form className="auth-form" onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              <TextField.Root
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <TextField.Root
                type="email"
                placeholder="Email address (for notifications)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Flex direction="column" gap="2">
                <Text size="2" color="gray">Account Type</Text>
                <Select.Root value={role} onValueChange={setRole}>
                  <Select.Trigger />
                  <Select.Content className="app-dropdown" position="popper" sideOffset={4}>
                    <Select.Item value="adopter">Adopter</Select.Item>
                    <Select.Item value="shelter_admin">Shelter</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
              <TextField.Root
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <TextField.Root
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <Text size="2" color="red">
                  Passwords do not match
                </Text>
              )}
              <Text size="1" color="gray">
              By creating an account, you agree to Paw Match&apos;s{" "}
              <Link asChild>
                <RouterLink to="/guidelines">Community Guidelines</RouterLink>
              </Link>{" "}
              and{" "}
              <Link asChild>
                <RouterLink to="/privacy">Privacy Policy</RouterLink>
              </Link>
              .
            </Text>

            <Button type="submit">Create account</Button>
            </Flex>
          </form>

          <Text size="2">
            Already have an account?{" "}
            <Link asChild>
              <RouterLink to="/login">Log in</RouterLink>
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

export default Register;
