import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import {
  getRecommendationPreferences,
  getRecommendationQueue,
  recordRecommendationInteraction,
  updateRecommendationPreferences,
} from "../services/recommendations.js";

const SPECIES_OPTIONS = ["Dog", "Cat", "Rabbit", "Bird"];
const SIZE_OPTIONS = ["Small", "Medium", "Large", "XL"];
const SEX_OPTIONS = ["M", "F"];

const emptyPreferences = {
  species: [],
  breeds: [],
  sex: [],
  sizes: [],
  min_age_years: "",
  max_age_years: "",
  city: "",
  state: "",
  postal_code: "",
  radius_miles: 50,
};

function normalizePreferences(preferences) {
  return {
    ...emptyPreferences,
    ...preferences,
    species: Array.isArray(preferences?.species) ? preferences.species : [],
    breeds: Array.isArray(preferences?.breeds) ? preferences.breeds : [],
    sex: Array.isArray(preferences?.sex) ? preferences.sex : [],
    sizes: Array.isArray(preferences?.sizes) ? preferences.sizes : [],
    min_age_years: preferences?.min_age_years ?? "",
    max_age_years: preferences?.max_age_years ?? "",
    city: preferences?.city || "",
    state: preferences?.state || "",
    postal_code: preferences?.postal_code || "",
    radius_miles: preferences?.radius_miles ?? 50,
  };
}

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function optionButtonVariant(values, value) {
  return values.includes(value) ? "solid" : "soft";
}

function toPayload(preferences) {
  return {
    species: preferences.species,
    breeds: preferences.breeds,
    sex: preferences.sex,
    sizes: preferences.sizes,
    min_age_years: preferences.min_age_years === "" ? null : Number(preferences.min_age_years),
    max_age_years: preferences.max_age_years === "" ? null : Number(preferences.max_age_years),
    city: preferences.city,
    state: preferences.state,
    postal_code: preferences.postal_code,
    radius_miles: Number(preferences.radius_miles) || 50,
  };
}

export default function Discover() {
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentPet = queue[currentIndex] || null;
  const remainingCount = Math.max(queue.length - currentIndex, 0);

  const locationLabel = useMemo(() => {
    const parts = [preferences.city, preferences.state, preferences.postal_code].filter(Boolean);
    return parts.length ? parts.join(", ") : "Any location";
  }, [preferences.city, preferences.state, preferences.postal_code]);

  useEffect(() => {
    let active = true;

    async function loadDiscoverData() {
      try {
        setLoading(true);
        setError("");
        const [savedPreferences, queueResult] = await Promise.all([
          getRecommendationPreferences(),
          getRecommendationQueue({ limit: 20 }),
        ]);

        if (!active) return;
        setPreferences(normalizePreferences(savedPreferences));
        setQueue(Array.isArray(queueResult?.items) ? queueResult.items : []);
        setCurrentIndex(0);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load recommendations.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDiscoverData();

    return () => {
      active = false;
    };
  }, []);

  async function refreshQueue() {
    const result = await getRecommendationQueue({ limit: 20 });
    setQueue(Array.isArray(result?.items) ? result.items : []);
    setCurrentIndex(0);
  }

  async function handleSavePreferences() {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const updated = await updateRecommendationPreferences(toPayload(preferences));
      setPreferences(normalizePreferences(updated));
      await refreshQueue();
      setMessage("Preferences saved.");
    } catch (err) {
      setError(err?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInteraction(interactionType) {
    if (!currentPet) return;

    try {
      setActing(true);
      setError("");
      await recordRecommendationInteraction({ petId: currentPet.id, interactionType });
      setCurrentIndex((index) => index + 1);
      if (interactionType === "liked") {
        setMessage(`${currentPet.name} was added to your favorites.`);
      } else {
        setMessage("");
      }
    } catch (err) {
      setError(err?.message || "Failed to save your choice.");
    } finally {
      setActing(false);
    }
  }

  function setArrayPreference(field, value) {
    setPreferences((current) => ({
      ...current,
      [field]: toggleValue(current[field], value),
    }));
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <Flex direction="column" gap="4">
        <Flex direction={{ initial: "column", sm: "row" }} justify="between" align={{ initial: "start", sm: "center" }} gap="3">
          <div>
            <Heading size="7">Discover Pets</Heading>
            <Text size="2" color="gray">Queue based on your saved filters and location.</Text>
          </div>
          <Button variant="soft" onClick={refreshQueue} disabled={loading || saving || acting}>
            Refresh
          </Button>
        </Flex>

        {error && <Text size="2" color="red">{error}</Text>}
        {message && <Text size="2" color="green">{message}</Text>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            alignItems: "start",
          }}
        >
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading size="4">Filters</Heading>

              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Species</Text>
                <Flex gap="2" wrap="wrap">
                  {SPECIES_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      size="1"
                      variant={optionButtonVariant(preferences.species, option)}
                      onClick={() => setArrayPreference("species", option)}
                    >
                      {option}
                    </Button>
                  ))}
                </Flex>
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Size</Text>
                <Flex gap="2" wrap="wrap">
                  {SIZE_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      size="1"
                      variant={optionButtonVariant(preferences.sizes, option)}
                      onClick={() => setArrayPreference("sizes", option)}
                    >
                      {option}
                    </Button>
                  ))}
                </Flex>
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Sex</Text>
                <Flex gap="2" wrap="wrap">
                  {SEX_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      size="1"
                      variant={optionButtonVariant(preferences.sex, option)}
                      onClick={() => setArrayPreference("sex", option)}
                    >
                      {option}
                    </Button>
                  ))}
                </Flex>
              </Flex>

              <Flex gap="2">
                <label style={{ flex: 1 }}>
                  <Text as="div" size="2" mb="1" weight="bold">Min age</Text>
                  <input
                    type="number"
                    min="0"
                    value={preferences.min_age_years}
                    onChange={(e) => setPreferences((current) => ({ ...current, min_age_years: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <Text as="div" size="2" mb="1" weight="bold">Max age</Text>
                  <input
                    type="number"
                    min="0"
                    value={preferences.max_age_years}
                    onChange={(e) => setPreferences((current) => ({ ...current, max_age_years: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
              </Flex>

              <Flex gap="2">
                <label style={{ flex: 1 }}>
                  <Text as="div" size="2" mb="1" weight="bold">City</Text>
                  <input
                    value={preferences.city}
                    onChange={(e) => setPreferences((current) => ({ ...current, city: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ width: 88 }}>
                  <Text as="div" size="2" mb="1" weight="bold">State</Text>
                  <input
                    value={preferences.state}
                    onChange={(e) => setPreferences((current) => ({ ...current, state: e.target.value.toUpperCase() }))}
                    maxLength={2}
                    style={inputStyle}
                  />
                </label>
              </Flex>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Postal code</Text>
                <input
                  value={preferences.postal_code}
                  onChange={(e) => setPreferences((current) => ({ ...current, postal_code: e.target.value }))}
                  style={inputStyle}
                />
              </label>

              <Button onClick={handleSavePreferences} disabled={saving || loading}>
                {saving ? "Saving..." : "Save filters"}
              </Button>
            </Flex>
          </Card>

          <Flex direction="column" align="center" gap="3">
            <Text size="2" color="gray">
              {loading ? "Loading queue..." : `${remainingCount} pets in queue for ${locationLabel}`}
            </Text>

            {!loading && !currentPet && (
              <Card size="3" style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
                <Flex direction="column" gap="3" align="center">
                  <Heading size="5">No Matches Right Now</Heading>
                  <Text size="2" color="gray">Try widening your filters or checking back after shelters add more pets.</Text>
                  <Button variant="soft" onClick={handleSavePreferences}>Update queue</Button>
                </Flex>
              </Card>
            )}

            {!loading && currentPet && (
              <Card size="3" style={{ width: "100%", maxWidth: 520 }}>
                <Flex direction="column" gap="3">
                  {currentPet.primary_photo_url && (
                    <img
                      src={currentPet.primary_photo_url}
                      alt={currentPet.name}
                      style={{
                        width: "100%",
                        aspectRatio: "4 / 3",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  )}

                  <Flex justify="between" align="start" gap="3">
                    <div>
                      <Heading size="6">{currentPet.name}</Heading>
                      <Text size="2" color="gray">
                        {currentPet.species || "Unknown"} / {currentPet.breed || "Unknown breed"}
                      </Text>
                    </div>
                    <Text size="2" color="gray">
                      {currentIndex + 1}/{queue.length}
                    </Text>
                  </Flex>

                  <Text size="2" color="gray">
                    Age: {currentPet.age_years ?? "?"} / Size: {currentPet.size || "?"} / Sex: {currentPet.sex || "?"}
                  </Text>
                  <Text size="2" color="gray">
                    {currentPet.shelter_name} {currentPet.shelter_city ? `- ${currentPet.shelter_city}, ${currentPet.shelter_state || ""}` : ""}
                  </Text>
                  {currentPet.description && (
                    <Text size="2" style={{ lineHeight: 1.6 }}>{currentPet.description}</Text>
                  )}

                  <Flex gap="3" justify="center" wrap="wrap">
                    <Button size="3" variant="soft" color="gray" disabled={acting} onClick={() => handleInteraction("passed")}>
                      Pass
                    </Button>
                    <Button size="3" disabled={acting} onClick={() => handleInteraction("liked")}>
                      Like
                    </Button>
                    <Button size="3" variant="soft" asChild>
                      <Link to={`/pets/${currentPet.id}`}>Details</Link>
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            )}
          </Flex>
        </div>
      </Flex>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 8,
  border: "1px solid rgba(255, 255, 255, 0.18)",
  background: "rgba(255, 255, 255, 0.06)",
  color: "#fff",
  padding: "9px 10px",
  font: "inherit",
};
