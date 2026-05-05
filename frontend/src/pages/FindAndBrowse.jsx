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
      className="page center-text find-section"
    >
      <Box>
        <Text size="6" weight="bold">
          Looking for your fur-ever friend?
        </Text>

        <Text size="3" color="gray" className="mt-12">
          We’ll help match you with a pet that fits your lifestyle.
        </Text>
      </Box>

      <Button size="4" onClick={() => navigate("/pet-finder")}>
        Find My Purrfect Pet
      </Button>

      <Text size="2" color="gray">
        <Link to="/browse-pets" className="link-underline">
          view all pets
        </Link>
      </Text>
    </Flex>
  );
}