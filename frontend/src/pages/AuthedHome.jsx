import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, Card, Flex, Heading, TabNav, Text } from "@radix-ui/themes";
import { useAuth } from "../auth/AuthContext.jsx";

function AuthedHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="auth-page">
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="4">
          <Flex align="center" justify="between" gap="3" wrap="wrap">
            <Heading size="6">Welcome back</Heading>
            <Button variant="soft" onClick={handleLogout}>Log out</Button>
          </Flex>
          <Text size="2" color="gray">
            Signed in as {user?.username || "user"}.
          </Text>

          <TabNav.Root>
            <TabNav.Link asChild active>
              <RouterLink to="/home">Home</RouterLink>
            </TabNav.Link>
            <TabNav.Link asChild>
              <RouterLink to="/view-pets">View Pets</RouterLink>
            </TabNav.Link>
            {user?.role === "shelter_admin" && (
              <TabNav.Link asChild>
                <RouterLink to="/create-pet">Create Pet</RouterLink>
              </TabNav.Link>
            )}
          </TabNav.Root>

          <Text size="2" color="gray">
            These routes are only visible after signing in.
          </Text>
        </Flex>
      </Card>
    </div>
  );
}

export default AuthedHome;
