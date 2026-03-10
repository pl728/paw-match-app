import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Text, Flex, Box } from "@radix-ui/themes";

export default function FindAndBrowse() {
  const navigate = useNavigate();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "48px 20px",
        textAlign: "center",
        gap: "24px"
      }}
    >
      <Box>
        <Text size="6" weight="bold">
          Looking for your fur-ever friend?
        </Text>
        <p></p>
        <Text size="3" color="gray" style={{ marginTop: "12px" }}>
          We’ll help match you with a pet that fits your lifestyle.
        </Text>
      </Box>

      <Button size="4" onClick={() => navigate("/pet-finder")}>
        Find My Purrfect Pet
      </Button>

      <Text size="2" color="gray">
        <Link to="/browse-pets" style={{ textDecoration: "underline" }}>
          view all pets
        </Link>
      </Text>
    </Flex>
  );
}
