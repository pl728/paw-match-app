import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Button, Card, Flex, Heading, Link, Select, Text, TextField } from "@radix-ui/themes";
import { registerUser, resendVerificationEmail, reverseGeocodeLocation } from "../services/auth.js";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("adopter");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);
  const autoLocationAttempted = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await registerUser({
        username,
        email,
        password,
        role,
        city: role === "adopter" ? city : undefined,
        state: role === "adopter" ? state : undefined,
        postal_code: role === "adopter" ? postalCode : undefined,
        latitude: role === "adopter" ? coordinates?.latitude : undefined,
        longitude: role === "adopter" ? coordinates?.longitude : undefined,
      });
      setPendingEmail(email);
      setResendMessage("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) {
      return;
    }

    setResending(true);
    setResendMessage("");
    try {
      const data = await resendVerificationEmail({ email: pendingEmail });
      setResendMessage(data.message || "Verification email sent.");
    } catch (err) {
      setResendMessage(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleUseBrowserLocation = useCallback(function handleUseBrowserLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location detection.");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(nextCoordinates);

        try {
          const detected = await reverseGeocodeLocation(nextCoordinates);
          if (detected.city) setCity(detected.city);
          if (detected.state) setState(detected.state);
          if (detected.postal_code) setPostalCode(detected.postal_code);

          const locationLabel = [detected.city, detected.state, detected.postal_code].filter(Boolean).join(", ");
          setLocationMessage(
            `Detected ${locationLabel || detected.formatted_address || "your location"}.`
          );
        } catch {
          setLocationMessage("Location detected, but we could not find city/state/ZIP. Enter city/state/ZIP manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setCoordinates(null);
        setLocationMessage("Could not detect your location. Enter city/state/ZIP instead.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (role !== "adopter" || autoLocationAttempted.current) {
      return;
    }

    autoLocationAttempted.current = true;
    handleUseBrowserLocation();
  }, [handleUseBrowserLocation, role]);

  if (pendingEmail) {
    return (
      <div className="auth-page">
        <Card size="3" variant="ghost">
          <Flex direction="column" gap="4">
            <Heading size="6">Verify your email</Heading>
            <Text size="2" color="gray">
              We sent a verification link to {pendingEmail}. Verify that email address before logging in.
            </Text>
            {resendMessage && (
              <Text size="2" color="gray">
                {resendMessage}
              </Text>
            )}
            <Flex gap="3" wrap="wrap">
              <Button type="button" variant="soft" onClick={handleResendVerification} disabled={resending}>
                {resending ? "Sending..." : "Resend verification email"}
              </Button>
              <Button asChild>
                <RouterLink to="/login">Go to login</RouterLink>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Card size="3" variant="ghost">
        <Flex direction="column" gap="4">
          <Heading size="6">Create your account</Heading>
          <Text size="2" color="gray">
            Add your email and location now so we can build better local pet matches.
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
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
              <Flex direction="column" gap="2">
                <Text size="2" color="gray">Account Type</Text>
                <Select.Root value={role} onValueChange={setRole} size="2">
                  <Select.Trigger className="full-width" />
                  <Select.Content position="popper" sideOffset={4} style={{ maxHeight: 200 }}>
                    <Select.Item value="adopter">Adopter</Select.Item>
                    <Select.Item value="shelter_admin">Shelter</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
              {role === "adopter" && (
                <Flex direction="column" gap="3">
                  <Button type="button" variant="soft" onClick={handleUseBrowserLocation} disabled={detectingLocation}>
                    {detectingLocation ? "Detecting location..." : "Use my browser location"}
                  </Button>
                  {locationMessage && (
                    <Text size="2" color={coordinates ? "green" : "gray"}>
                      {locationMessage}
                    </Text>
                  )}
                  <Flex gap="2" wrap="wrap">
                    <TextField.Root
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-grow"
                    />
                    <TextField.Root
                      type="text"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </Flex>
                  <TextField.Root
                    type="text"
                    placeholder="ZIP code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                  <Text size="2" color="gray">
                    Location helps us recommend pets near you. We will try to fill this automatically.
                  </Text>
                </Flex>
              )}
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
