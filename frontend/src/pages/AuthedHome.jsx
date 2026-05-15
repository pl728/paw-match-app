import React from "react";
import { Link } from "react-router-dom";
import { Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import { useAuth } from "../auth/useAuth.js";

function AuthedHome() {
  const { user } = useAuth();
  const isAdmin = user?.role === "shelter_admin";

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <Text size="2" weight="bold" className="home-kicker">
            Welcome back, {user?.username || "user"}
          </Text>

          <h1 className="home-title">
            {isAdmin ? "Manage your shelter listings." : "Helping pets find loving homes."}
          </h1>

          <p className="home-subtitle">
            {isAdmin
              ? "Add pets, update adoption statuses, manage listings, and connect with adopters."
              : "Browse adoptable pets, connect with shelters, and keep track of the animals you care about."}
          </p>

          <div className="cta-row">
            {isAdmin ? (
              <>
                <Link to="/view-admin-pets" className="cta">Manage Pets</Link>
                <Link to="/create-pet" className="cta ghost">Add New Pet</Link>
              </>
            ) : (
              <>
                <Link to="/browse-pets" className="cta">View Available Pets</Link>
                <Link to="/favorites" className="cta ghost">My Favorites</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <Grid columns={{ initial: "1", sm: "3" }} gap="4" className="home-action-grid">
        {isAdmin ? (
          <>
            <Card className="home-action-card">
              <Heading size="5">Manage Pets</Heading>
              <Text color="gray">View, edit, and update pets listed by your shelter.</Text>
              <Button asChild variant="soft" mt="3">
                <Link to="/view-admin-pets">Open Listings</Link>
              </Button>
            </Card>

            <Card className="home-action-card">
              <Heading size="5">Add Pet</Heading>
              <Text color="gray">Create a new pet profile with photos, breed, age, and status.</Text>
              <Button asChild variant="soft" mt="3">
                <Link to="/create-pet">Add Pet</Link>
              </Button>
            </Card>

            <Card className="home-action-card">
              <Heading size="5">Messages</Heading>
              <Text color="gray">Respond to adopters interested in your shelter animals.</Text>
              <Button asChild variant="soft" mt="3">
                <Link to="/conversations">Open Messages</Link>
              </Button>
            </Card>
          </>
        ) : (
          <>
            <Card className="home-action-card">
              <Heading size="5">Adoptions</Heading>
              <Text color="gray">Search pets by species, breed, age, and size.</Text>
              <Button asChild variant="soft" mt="3">
                <Link to="/browse-pets">Browse Pets</Link>
              </Button>
            </Card>

            <Card className="home-action-card">
              <Heading size="5">Messages</Heading>
              <Text color="gray">Continue conversations with shelters about pets you are interested in.</Text>
              <Button asChild variant="soft" mt="3">
                <Link to="/conversations">Open Messages</Link>
              </Button>
            </Card>

            <Card className="home-action-card">
              <Heading size="5">Activity Feed</Heading>
              <Text color="gray">See the latest shelter posts, new pets, and adoption updates.</Text>
              <Button asChild variant="soft" mt="3">
                <Link to="/feed">View Feed</Link>
              </Button>
            </Card>
          </>
        )}
      </Grid>

      <section className="home-mission">
        <div>
          <Text size="2" weight="bold" className="home-kicker">
            {isAdmin ? "Shelter Dashboard" : "Latest Updates"}
          </Text>

          <Heading size="7">
            {isAdmin ? "Keep your pet listings updated." : "Stay connected with shelter activity."}
          </Heading>

          <Text size="3" color="gray" className="home-mission-text">
            {isAdmin
              ? "Make sure pet photos, details, and adoption statuses are current so adopters have accurate information."
              : "Check the activity feed for new pets, shelter posts, photo updates, and adoption events."}
          </Text>

          <Button asChild mt="4">
            <Link to={isAdmin ? "/view-admin-pets" : "/feed"}>
              {isAdmin ? "Manage Shelter Pets" : "Go to Animal Activity Feed"}
            </Link>
          </Button>
        </div>

        <Card className="home-news-card">
          <Heading size="5">
            {isAdmin ? "Admin shortcuts" : "What you can do today"}
          </Heading>

          <Flex direction="column" gap="3" mt="3">
            {isAdmin ? (
              <>
                <Link to="/create-pet" className="home-news-link">Add a new pet</Link>
                <Link to="/view-admin-pets" className="home-news-link">Edit pet listings</Link>
                <Link to="/conversations" className="home-news-link">Reply to adopter messages</Link>
                <Link to="/setup-shelter" className="home-news-link">Update shelter profile</Link>
              </>
            ) : (
              <>
                <Link to="/browse-pets" className="home-news-link">Find an adoptable pet</Link>
                <Link to="/favorites" className="home-news-link">Review saved pets</Link>
                <Link to="/feed" className="home-news-link">Check shelter updates</Link>
                <Link to="/conversations" className="home-news-link">Follow up with a shelter</Link>
              </>
            )}
          </Flex>
        </Card>
      </section>
    </main>
  );
}

export default AuthedHome;