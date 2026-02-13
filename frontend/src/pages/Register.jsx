import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Card, Flex, Heading, Link, Select, Text, TextField } from "@radix-ui/themes";
import { registerUser } from "../services/auth.js";
import { useAuth } from "../auth/AuthContext.jsx";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("adopter");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await registerUser({ username, password, role });
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
              <Flex direction="column" gap="2">
                <Text size="2" color="gray">Account type</Text>
                <Select.Root value={role} onValueChange={setRole}>
                  <Select.Trigger />
                  <Select.Content>
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
