import React, { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, Box } from "@radix-ui/themes";
import { getShelters } from "../services/shelters.js";

function BrowseShelters() {
  const [shelters, setShelters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;
    async function fetchShelters() {
      try {
        const data = await getShelters();
        if (isActive) {
          setShelters(data);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }
    fetchShelters();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '48px 20px'
    }}>
      <Heading size="6" mb="4">Browse Shelters</Heading>

      {loading && <Text size="2" color="gray">Loading shelters…</Text>}
      {error && <Text size="2" color="red">{error}</Text>}

      {!loading && !error && (
        <Flex direction="column" gap="3">
          {shelters && shelters.length > 0 ? (
            shelters.map(shelter => (
              <Card key={shelter.id} size="3">
                <Flex direction="column" gap="2">
                  <Heading size="4">{shelter.name}</Heading>

                  {shelter.description && (
                    <Text size="2" color="gray">{shelter.description}</Text>
                  )}

                  <Flex gap="4" wrap="wrap">
                    {shelter.city && shelter.state && (
                      <Box>
                        <Text size="1" weight="bold" as="div">Location</Text>
                        <Text size="2" color="gray">{shelter.city}, {shelter.state}</Text>
                      </Box>
                    )}

                    {shelter.phone && (
                      <Box>
                        <Text size="1" weight="bold" as="div">Phone</Text>
                        <Text size="2" color="gray">{shelter.phone}</Text>
                      </Box>
                    )}

                    {shelter.email && (
                      <Box>
                        <Text size="1" weight="bold" as="div">Email</Text>
                        <Text size="2" color="gray">{shelter.email}</Text>
                      </Box>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))
          ) : (
            <Text size="2" color="gray">No shelters found</Text>
          )}
        </Flex>
      )}
    </div>
  );
}

export default BrowseShelters;
