import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Dialog, Flex, Heading, IconButton, Slider, Text } from "@radix-ui/themes";
import { Cross2Icon, HeartFilledIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import {
  getRecommendationPreferences,
  getRecommendationQueue,
  recordRecommendationInteraction,
  updateRecommendationPreferences,
} from "../services/recommendations.js";
import { reverseGeocodeLocation } from "../services/auth.js";

const SPECIES_OPTIONS = ["Dog", "Cat", "Rabbit", "Bird"];
const SIZE_OPTIONS = ["Small", "Medium", "Large", "XL"];
const SEX_OPTIONS = ["M", "F"];
const MIN_RADIUS_MILES = 5;
const MAX_RADIUS_MILES = 100;
const RADIUS_STEP_MILES = 5;
const MIN_AGE_YEARS = 0;
const MAX_AGE_YEARS = 20;
const DEFAULT_MAP_CENTER = { latitude: 44.5646, longitude: -123.262 };

let googleMapsPromise = null;

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
  latitude: null,
  longitude: null,
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
    latitude: preferences?.latitude ?? null,
    longitude: preferences?.longitude ?? null,
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

function getMapApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
}

function loadGoogleMaps() {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = getMapApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not set"));
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector("script[data-paw-match-google-maps]");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.defer = true;
      script.dataset.pawMatchGoogleMaps = "true";
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error("Google Maps failed to load"));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
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
    latitude: preferences.latitude,
    longitude: preferences.longitude,
    radius_miles: Number(preferences.radius_miles) || 50,
  };
}

export default function Discover() {
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [draftPreferences, setDraftPreferences] = useState(emptyPreferences);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentPet = queue[currentIndex] || null;

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
        const normalized = normalizePreferences(savedPreferences);
        setPreferences(normalized);
        setDraftPreferences(normalized);
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
    try {
      setQueueLoading(true);
      setError("");
      const result = await getRecommendationQueue({ limit: 20 });
      setQueue(Array.isArray(result?.items) ? result.items : []);
      setCurrentIndex(0);
    } catch (err) {
      setError(err?.message || "Failed to refresh recommendations.");
    } finally {
      setQueueLoading(false);
    }
  }

  async function handleSavePreferences() {
    try {
      setSaving(true);
      setQueueLoading(true);
      setFiltersOpen(false);
      setError("");
      setMessage("");
      const updated = await updateRecommendationPreferences(toPayload(draftPreferences));
      const normalized = normalizePreferences(updated);
      setPreferences(normalized);
      setDraftPreferences(normalized);
      const result = await getRecommendationQueue({ limit: 20 });
      setQueue(Array.isArray(result?.items) ? result.items : []);
      setCurrentIndex(0);
    } catch (err) {
      setError(err?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
      setQueueLoading(false);
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
    setDraftPreferences((current) => ({
      ...current,
      [field]: toggleValue(current[field], value),
    }));
  }

  function openFilters() {
    setDraftPreferences(preferences);
    setFiltersOpen(true);
  }

  const cardBusy = loading || queueLoading || saving;

  return (
    <div className="page">
      <Flex direction="column" gap="4">
        <Flex direction={{ initial: "column", sm: "row" }} justify="between" align={{ initial: "start", sm: "center" }} gap="3">
          <div>
            <Heading size="7">Discover Pets</Heading>
          </div>
          <Flex gap="2" wrap="wrap">
            <Button variant="soft" onClick={openFilters} disabled={loading || saving || acting}>
              Filters
            </Button>
            <Button variant="soft" onClick={refreshQueue} disabled={loading || queueLoading || saving || acting}>
              {queueLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </Flex>
        </Flex>

        {error && <Text size="2" color="red">{error}</Text>}
        {message && <Text size="2" color="green">{message}</Text>}

        <Dialog.Root open={filtersOpen} onOpenChange={(open) => {
          if (!saving) setFiltersOpen(open);
        }}>
          <Dialog.Content maxWidth="560px">
            <Dialog.Title>Discover Filters</Dialog.Title>
            <Dialog.Description size="2" color="gray">
              Save your preferences to rebuild the recommendation queue.
            </Dialog.Description>

            <Flex direction="column" gap="4" mt="4">
              {renderFilterControls({
                preferences: draftPreferences,
                setPreferences: setDraftPreferences,
                setArrayPreference,
                saving,
              })}

              <Flex gap="3" justify="end">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => {
                    setDraftPreferences(preferences);
                    setFiltersOpen(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePreferences} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save filters"}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>

        <Flex direction="column" align="center" gap="3">
            {cardBusy && (
              <Card size="3" className="discover-card">
                <Flex direction="column" justify="center" align="center" gap="3" className="discover-loading">
                  <div className="spinner" />
                  <Heading size="5">Building your queue</Heading>
                  <Text size="2" color="gray">Finding the best pets for your filters.</Text>
                </Flex>
              </Card>
            )}

            {!cardBusy && !currentPet && (
              <Card size="3" className="discover-card">
                <Flex direction="column" gap="3" align="center">
                  <Heading size="5">No Matches Right Now</Heading>
                  <Text size="2" color="gray">Try widening your filters or checking back after shelters add more pets.</Text>
                  <Button variant="soft" onClick={openFilters}>Adjust filters</Button>
                </Flex>
              </Card>
            )}

            {!cardBusy && currentPet && (
              <Card size="3" className="discover-card">
                <Flex direction="column" gap="3">
                  <div className="photo-frame">
                    {acting ? (
                      <Flex direction="column" align="center" justify="center" gap="3" className="full-height">
                        <div className="spinner" />
                        <Text size="2" color="gray">Saving your choice...</Text>
                      </Flex>
                    ) : currentPet.primary_photo_url ? (
                    <img
                      src={currentPet.primary_photo_url}
                      alt={currentPet.name}
                      className="discover-photo"
                    />
                    ) : (
                      <Flex align="center" justify="center" className="full-height">
                        <Text size="2" color="gray">Photo coming soon</Text>
                      </Flex>
                    )}
                  </div>

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
                    <Text size="2" className="description-text">{currentPet.description}</Text>
                  )}

                  <Flex gap="3" justify="center" align="center" wrap="wrap">
                    <IconButton
                      size="4"
                      radius="full"
                      variant="soft"
                      color="gray"
                      disabled={acting}
                      onClick={() => handleInteraction("passed")}
                      aria-label="Pass"
                    >
                      <Cross2Icon width="22" height="22" />
                    </IconButton>
                    <IconButton
                      size="4"
                      radius="full"
                      color="red"
                      disabled={acting}
                      onClick={() => handleInteraction("liked")}
                      aria-label="Like"
                    >
                      <HeartFilledIcon width="22" height="22" />
                    </IconButton>
                    <IconButton size="4" radius="full" variant="soft" asChild aria-label="Details">
                      <Link to={`/pets/${currentPet.id}`}>
                        <InfoCircledIcon width="22" height="22" />
                      </Link>
                    </IconButton>
                  </Flex>
                </Flex>
              </Card>
            )}
        </Flex>
      </Flex>
    </div>
  );
}

function LocationMapPicker({ preferences, setPreferences, saving }) {
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const savingRef = React.useRef(saving);
  const [initialCenter] = React.useState(() => (
    preferences.latitude !== null && preferences.longitude !== null
      ? { latitude: Number(preferences.latitude), longitude: Number(preferences.longitude) }
      : DEFAULT_MAP_CENTER
  ));
  const [status, setStatus] = React.useState("");
  const [mapReady, setMapReady] = React.useState(false);
  const hasMapKey = Boolean(getMapApiKey());

  React.useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  const updateLocationFromCoordinates = React.useCallback(async function updateLocationFromCoordinates(nextCoordinates) {
    setPreferences((current) => ({
      ...current,
      latitude: nextCoordinates.latitude,
      longitude: nextCoordinates.longitude,
    }));

    try {
      setStatus("Looking up city, state, and ZIP...");
      const detected = await reverseGeocodeLocation(nextCoordinates);
      setPreferences((current) => ({
        ...current,
        city: detected.city || current.city,
        state: detected.state || current.state,
        postal_code: detected.postal_code || current.postal_code,
      }));
      const label = [detected.city, detected.state, detected.postal_code].filter(Boolean).join(", ");
      setStatus(label ? `Search location set to ${label}.` : "Search location updated.");
    } catch {
      setStatus("Search location updated. City/state/ZIP can still be edited manually.");
    }
  }, [setPreferences]);

  function handleUseBrowserLocation() {
    if (!navigator.geolocation) {
      setStatus("Your browser does not support location detection.");
      return;
    }

    setStatus("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        mapRef.current?.setCenter({ lat: nextCoordinates.latitude, lng: nextCoordinates.longitude });
        markerRef.current?.setPosition({ lat: nextCoordinates.latitude, lng: nextCoordinates.longitude });
        updateLocationFromCoordinates(nextCoordinates);
      },
      () => setStatus("Could not detect your location. Pick a point on the map instead."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  React.useEffect(() => {
    if (!hasMapKey || !containerRef.current) return undefined;

    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        const center = { lat: initialCenter.latitude, lng: initialCenter.longitude };
        const map = new maps.Map(containerRef.current, {
          center,
          zoom: initialCenter === DEFAULT_MAP_CENTER ? 5 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new maps.Marker({
          map,
          position: center,
          draggable: true,
          title: "Search location",
        });

        map.addListener("click", (event) => {
          if (savingRef.current || !event.latLng) return;
          const nextCoordinates = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          };
          marker.setPosition(event.latLng);
          updateLocationFromCoordinates(nextCoordinates);
        });
        marker.addListener("dragend", (event) => {
          if (savingRef.current || !event.latLng) return;
          updateLocationFromCoordinates({
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          });
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.message || "Google Maps failed to load.");
      });

    return () => {
      cancelled = true;
    };
  }, [hasMapKey, initialCenter, updateLocationFromCoordinates]);

  React.useEffect(() => {
    if (!mapReady || !markerRef.current || !mapRef.current) return;
    if (preferences.latitude === null || preferences.longitude === null) return;

    const position = { lat: Number(preferences.latitude), lng: Number(preferences.longitude) };
    markerRef.current.setPosition(position);
    mapRef.current.setCenter(position);
  }, [mapReady, preferences.latitude, preferences.longitude]);

  return (
    <Flex direction="column" gap="2">
      <Flex justify="between" align="center" gap="3" wrap="wrap">
        <Text size="2" weight="bold">Location</Text>
        <Button type="button" variant="soft" size="1" onClick={handleUseBrowserLocation} disabled={saving}>
          Use my location
        </Button>
      </Flex>

      {hasMapKey ? (
        <div ref={containerRef} className="location-map-picker" />
      ) : (
        <div className="location-map-missing-key">
          <Text size="2" color="gray">
            Add VITE_GOOGLE_MAPS_API_KEY to enable the map picker.
          </Text>
        </div>
      )}

      {status && <Text size="2" color="gray">{status}</Text>}
    </Flex>
  );
}

function renderFilterControls({ preferences, setPreferences, setArrayPreference, saving }) {
  return (
    <>
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold">Species</Text>
        <Flex gap="2" wrap="wrap">
          {SPECIES_OPTIONS.map((option) => (
            <Button
              key={option}
              size="1"
              variant={optionButtonVariant(preferences.species, option)}
              onClick={() => setArrayPreference("species", option)}
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            >
              {option}
            </Button>
          ))}
        </Flex>
      </Flex>

      {(() => {
        const minAge = preferences.min_age_years === "" || preferences.min_age_years === null
          ? MIN_AGE_YEARS
          : Number(preferences.min_age_years);
        const maxAge = preferences.max_age_years === "" || preferences.max_age_years === null
          ? MAX_AGE_YEARS
          : Number(preferences.max_age_years);
        return (
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" weight="bold">Age</Text>
              <Text size="2" color="gray">{minAge} – {maxAge} yrs</Text>
            </Flex>
            <Slider
              min={MIN_AGE_YEARS}
              max={MAX_AGE_YEARS}
              step={1}
              value={[minAge, maxAge]}
              onValueChange={(values) => setPreferences((current) => ({
                ...current,
                min_age_years: values[0],
                max_age_years: values[1],
              }))}
              disabled={saving}
            />
          </Flex>
        );
      })()}

      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="2" weight="bold">Distance</Text>
          <Text size="2" color="gray">{Number(preferences.radius_miles) || 50} mi</Text>
        </Flex>
        <Slider
          min={MIN_RADIUS_MILES}
          max={MAX_RADIUS_MILES}
          step={RADIUS_STEP_MILES}
          value={[Number(preferences.radius_miles) || 50]}
          onValueChange={(values) => setPreferences((current) => ({ ...current, radius_miles: values[0] }))}
          disabled={saving}
        />
      </Flex>

      <LocationMapPicker preferences={preferences} setPreferences={setPreferences} saving={saving} />
    </>
  );
}
