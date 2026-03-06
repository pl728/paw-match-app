import React, { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, Box, Button } from "@radix-ui/themes";
import { getShelters } from "../services/shelters.js";

// You should have userId from auth context or props
function BrowseShelters({ userId }) {
  const [shelters, setShelters] = useState([]);
  const [followed, setFollowed] = useState([]); // IDs of followed shelters
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all shelters
  useEffect(() => {
    let isActive = true;
    async function fetchSheltersData() {
      try {
        const data = await getShelters();
        if (isActive) setShelters(data);
      } catch (err) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }
    fetchSheltersData();
    return () => { isActive = false; };
  }, []);

  // Fetch followed shelters for the current user
  useEffect(() => {
    let isActive = true;
    async function fetchFollowed() {
      try {
        const res = await fetch(`/api/users/${userId}/followed-shelters`);
        const data = await res.json(); // expects array of shelter IDs
        if (isActive) setFollowed(data);
      } catch (err) {
        console.error("Failed to fetch followed shelters:", err);
      }
    }
    fetchFollowed();
    return () => { isActive = false; };
  }, [userId]);

  // Toggle follow/unfollow
  const toggleFollow = async (shelterId) => {
    if (followed.includes(shelterId)) {
      // Unfollow
      try {
        await fetch(`/api/users/${userId}/unfollow-shelter`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shelterId }),
        });
        setFollowed(prev => prev.filter(id => id !== shelterId));
      } catch (err) {
        console.error(err);
      }
    } else {
      // Follow
      try {
        await fetch(`/api/users/${userId}/follow-shelter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shelterId }),
        });
        setFollowed(prev => [...prev, shelterId]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Separate followed vs available shelters
  const followedShelters = shelters.filter(s => followed.includes(s.id));
  const availableShelters = shelters.filter(s => !followed.includes(s.id));

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
      <Heading size="6" mb="4">Followed Shelters</Heading>

      {loading && <Text size="2" color="gray">Loading shelters…</Text>}
      {error && <Text size="2" color="red">{error}</Text>}

      {!loading && !error && (
        <>
          {/* Followed Shelters Section */}
          {followedShelters.length > 0 ? (
            <Flex direction="column" gap="3" mb="6">
              {followedShelters.map(shelter => (
                <Card key={shelter.id} size="3">
                  <Flex direction="column" gap="2">
                    <Heading size="4">{shelter.name}</Heading>
                    {shelter.city && shelter.state && (
                      <Text size="2" color="gray">{shelter.city}, {shelter.state}</Text>
                    )}
                    <Button size="2" variant="outline" onClick={() => toggleFollow(shelter.id)}>
                      Unfollow
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Flex>
          ) : (
            <Text size="2" color="gray" mb="6">You are not following any shelters.</Text>
          )}

          <Heading size="6" mb="4">All Shelters</Heading>
          {/* All Shelters Section */}
          <Flex direction="column" gap="3">
            {availableShelters.length > 0 ? (
              availableShelters.map(shelter => (
                <Card key={shelter.id} size="3">
                  <Flex direction="column" gap="2">
                    <Heading size="4">{shelter.name}</Heading>
                    {shelter.city && shelter.state && (
                      <Text size="2" color="gray">{shelter.city}, {shelter.state}</Text>
                    )}
                    <Button size="2" variant="ghost" onClick={() => toggleFollow(shelter.id)}>
                      Follow
                    </Button>
                  </Flex>
                </Card>
              ))
            ) : (
              <Text size="2" color="gray">No shelters available.</Text>
            )}
          </Flex>
        </>
      )}
    </div>
  );
}

export default BrowseShelters;