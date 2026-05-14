import React from "react";
import { Link } from "react-router-dom";
import { Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { useAuth } from "../auth/useAuth.js";

function AuthedHome() {
  const { user } = useAuth();

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <Text size="2" weight="bold" className="home-kicker">
            Welcome back, {user?.username || "user"}
          </Text>

          <Heading size="9" className="home-title">
            Helping pets find loving homes.
          </Heading>

          <Text size="4" className="home-subtitle">
            Browse adoptable pets, connect with shelters, and keep track of the animals you care about.
          </Text>

          <Flex gap="3" wrap="wrap">
            <Button asChild size="3">
              <Link to="/pets">View Available Pets</Link>
            </Button>

            <Button asChild size="3" variant="soft">
              <Link to="/favorites">My Favorites</Link>
            </Button>
          </Flex>
        </div>
      </section>

      <Grid columns={{ initial: "1", sm: "3" }} gap="4" className="home-action-grid">
        <Card className="home-action-card">
          <Heading size="5">Adoptions</Heading>
          <Text color="gray">
            Search pets by species, breed, age, and size.
          </Text>
          <Button asChild variant="soft" mt="3">
            <Link to="/pets">Browse Pets</Link>
          </Button>
        </Card>

        <Card className="home-action-card">
          <Heading size="5">Messages</Heading>
          <Text color="gray">
            Continue conversations with shelters about pets you are interested in.
          </Text>
          <Button asChild variant="soft" mt="3">
            <Link to="/messages">Open Messages</Link>
          </Button>
        </Card>

        <Card className="home-action-card">
          <Heading size="5">Profile</Heading>
          <Text color="gray">
            Keep your account information and adoption preferences up to date.
          </Text>
          <Button asChild variant="soft" mt="3">
            <Link to="/profile">View Profile</Link>
          </Button>
        </Card>
      </Grid>

      <section className="home-mission">
        <div>
          <Text size="2" weight="bold" className="home-kicker">
            Our Mission
          </Text>

          <Heading size="7">
            Making adoption simple, organized, and accessible.
          </Heading>

          <Text size="3" color="gray" className="home-mission-text">
            Pawfect Planner helps adopters and shelters stay connected so pets can move one step closer to a safe and caring home.
          </Text>
        </div>

        <Card className="home-news-card">
          <Heading size="5">What you can do today</Heading>

          <Flex direction="column" gap="3" mt="3">
            <Link to="/pets" className="home-news-link">Find an adoptable pet</Link>
            <Link to="/favorites" className="home-news-link">Review saved pets</Link>
            <Link to="/messages" className="home-news-link">Follow up with a shelter</Link>
          </Flex>
        </Card>
      </section>
    </main>
  );
}

export default AuthedHome;