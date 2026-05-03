import React, { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { useAuth } from "../auth/useAuth.js";
import { getShelters, getFollowedShelterIds, followShelter, unfollowShelter } from "../services/shelters.js";

function BrowseShelters() {
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyShelterId, setBusyShelterId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function fetchSheltersData() {
      try {
        setLoading(true);
        setError(null);
        setMessage("");

        const [allShelters, followedShelterIds] = await Promise.all([
          getShelters(),
          user?.role === "adopter" ? getFollowedShelterIds() : Promise.resolve([]),
        ]);

        if (!isActive) return;
        setShelters(Array.isArray(allShelters) ? allShelters : []);
        setFollowed(followedShelterIds);
      } catch (err) {
        if (!isActive) return;
        setError(err?.message || "Failed to load shelters.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchSheltersData();
    return () => {
      isActive = false;
    };
  }, [user?.role]);

  async function toggleFollow(shelterId) {
    if (user?.role !== "adopter") {
      setMessage("Only adopter accounts can follow shelters.");
      return;
    }

    setBusyShelterId(shelterId);
    setMessage("");

    try {
      if (followed.includes(shelterId)) {
        await unfollowShelter(shelterId);
        setFollowed((current) => current.filter((id) => id !== shelterId));
        setMessage("Shelter unfollowed.");
      } else {
        await followShelter(shelterId);
        setFollowed((current) => [...current, shelterId]);
        setMessage("Shelter followed.");
      }
    } catch (err) {
      setMessage(err?.message || "Could not update followed shelters.");
    } finally {
      setBusyShelterId(null);
    }
  }

  const followedShelters = shelters.filter((shelter) => followed.includes(shelter.id));
  const availableShelters = shelters.filter((shelter) => !followed.includes(shelter.id));

  return (
    <div className="page">
      <Flex direction="column" gap="4">
        <Heading size="6">Browse Shelters</Heading>

        {message ? <Text size="2" color="gray">{message}</Text> : null}
        {loading && <Text size="2" color="gray">Loading shelters…</Text>}
        {error && <Text size="2" color="red">{error}</Text>}

        {!loading && !error && (
          <>
            <Heading size="5">Followed Shelters</Heading>
            {followedShelters.length > 0 ? (
              <Flex direction="column" gap="3">
                {followedShelters.map((shelter) => (
                  <Card key={shelter.id} size="3">
                    <Flex justify="between" align="center" gap="3" wrap="wrap">
                      <Flex direction="column" gap="2" className="flex-grow">
                        <Heading size="4">{shelter.name}</Heading>
                        {shelter.city && shelter.state ? (
                          <Text size="2" color="gray">{shelter.city}, {shelter.state}</Text>
                        ) : null}
                      </Flex>
                      <Button
                        size="2"
                        variant="soft"
                        onClick={() => toggleFollow(shelter.id)}
                        disabled={busyShelterId === shelter.id}
                      >
                        {busyShelterId === shelter.id ? "Working..." : "Unfollow"}
                      </Button>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            ) : (
              <Text size="2" color="gray">You are not following any shelters.</Text>
            )}

            <Heading size="5" mt="4">All Shelters</Heading>
            {availableShelters.length > 0 ? (
              <Flex direction="column" gap="3">
                {availableShelters.map((shelter) => (
                  <Card key={shelter.id} size="3">
                    <Flex justify="between" align="center" gap="3" wrap="wrap">
                      <Flex direction="column" gap="2" className="flex-grow">
                        <Heading size="4">{shelter.name}</Heading>
                        {shelter.city && shelter.state ? (
                          <Text size="2" color="gray">{shelter.city}, {shelter.state}</Text>
                        ) : null}
                      </Flex>
                      <Button
                        size="2"
                        variant="soft"
                        onClick={() => toggleFollow(shelter.id)}
                        disabled={busyShelterId === shelter.id}
                      >
                        {busyShelterId === shelter.id ? "Working..." : "Follow"}
                      </Button>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            ) : (
              <Text size="2" color="gray">No shelters available.</Text>
            )}
          </>
        )}
      </Flex>
    </div>
  );
}

export default BrowseShelters;
