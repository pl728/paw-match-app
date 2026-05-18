import React, { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { verifyEmailToken } from "../services/auth.js";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const token = searchParams.get("token");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Verification link is missing a token.");
        return;
      }

      try {
        const data = await verifyEmailToken(token);
        if (!cancelled) {
          setStatus("success");
          setMessage(data.message || "Email verified. You can now log in.");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.message);
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth-page">
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="4">
          <Heading size="6">
            {status === "success" ? "Email verified" : "Verify email"}
          </Heading>
          <Text size="2" color={status === "error" ? "red" : "gray"}>
            {message}
          </Text>
          {status === "success" && (
            <Button asChild>
              <RouterLink to="/login?verified=1">Go to login</RouterLink>
            </Button>
          )}
          {status === "error" && (
            <Button asChild variant="soft">
              <RouterLink to="/login">Back to login</RouterLink>
            </Button>
          )}
        </Flex>
      </Card>
    </div>
  );
}

export default VerifyEmail;
