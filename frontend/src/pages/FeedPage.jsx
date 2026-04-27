import { useEffect, useMemo, useState } from "react";
import FeedList from "../components/FeedList.jsx";
import { useAuth } from "../auth/useAuth.js";
import { followShelter, getFollowedShelterIds, unfollowShelter } from "../services/shelters.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function normalizeFeedText(value) {
  if (value == null) return "";
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "undefined") return "";
  return value;
}

function mapRowToFeedItem(row) {
  return {
    id: row.id,
    type: row.event_type,
    createdAt: row.created_at,
    shelter: {
      id: row.shelter_id,
      name: row.shelter_name,
      location: row.shelter_location ?? "",
    },
    pet: row.pet_id
      ? {
          id: row.pet_id,
          name: normalizeFeedText(row.pet_name),
          primaryPhotoUrl: normalizeFeedText(row.primary_photo_url),
        }
      : null,
    title: normalizeFeedText(row.title),
    body: normalizeFeedText(row.body),
  };
}

export default function FeedPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [followedShelterIds, setFollowedShelterIds] = useState([]);

  async function load() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const [res, followedIds] = await Promise.all([
        fetch(`${API_BASE}/feed_events?limit=50`, {
          credentials: "include",
        }),
        user?.role === "adopter" ? getFollowedShelterIds() : Promise.resolve([]),
      ]);

      if (!res.ok) throw new Error(`Failed to load feed (${res.status})`);

      const data = await res.json();

      const rows = Array.isArray(data) ? data : (data.items ?? []);
      const mapped = rows.map(mapRowToFeedItem);

      setItems(mapped);
      setFollowedShelterIds(followedIds);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err?.message || "Unknown error");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, [user?.role]);

  async function handleToggleShelterFollow(shelterId) {
    if (!shelterId) {
      return { message: "Shelter not found." };
    }

    if (user?.role !== "adopter") {
      return { message: "Only adopter accounts can follow shelters." };
    }

    const isFollowed = followedShelterIds.includes(shelterId);

    try {
      if (isFollowed) {
        await unfollowShelter(shelterId);
        setFollowedShelterIds((current) => current.filter((id) => id !== shelterId));
        return { message: "Shelter unfollowed." };
      }

      await followShelter(shelterId);
      setFollowedShelterIds((current) => (current.includes(shelterId) ? current : [...current, shelterId]));
      return { message: "Shelter followed." };
    } catch (err) {
      return { message: err?.message || "Could not update shelter follow state." };
    }
  }

  const visibleItems = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((i) => i.type === filterType);
  }, [items, filterType]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Animal Activity Feed</h1>
          <p className="muted">Latest updates from shelters and pets.</p>
        </div>

        <div className="controls">
          <label className="control">
            <span className="control-label">Type</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="new_pet">New pet</option>
              <option value="status_change">Status change</option>
              <option value="adoption_event">Adoption event</option>
              <option value="photo_added">Photo added</option>
              <option value="shelter_post">Shelter post</option>
            </select>
          </label>

          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="stack">
          <div className="skeleton card" />
          <div className="skeleton card" />
          <div className="skeleton card" />
        </div>
      )}

      {status === "error" && (
        <div className="card">
          <h2>Could not load feed</h2>
          <p className="muted">{errorMsg}</p>
          <button className="btn" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {status === "ready" && visibleItems.length === 0 && (
        <div className="card">
          <h2>No activity yet</h2>
          <p className="muted">Check back later.</p>
        </div>
      )}

      {status === "ready" && visibleItems.length > 0 && (
        <FeedList
          items={visibleItems}
          followedShelterIds={followedShelterIds}
          onToggleShelterFollow={handleToggleShelterFollow}
        />
      )}
    </div>
  );
}
