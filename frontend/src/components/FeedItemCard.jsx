import { useState } from "react";
import { useNavigate } from "react-router-dom";

function typeLabel(type) {
  const map = {
    new_pet: "New Pet",
    status_change: "Status Change",
    adoption_event: "Adoption Event",
    photo_added: "Photo Added",
    update: "Update",
  };
  return map[type] || "Activity";
}

function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FeedItemCard({ item, isShelterFollowed, onToggleShelterFollow }) {
  const navigate = useNavigate();
  const time = formatTime(item?.createdAt);
  const [following, setFollowing] = useState(false);
  const [followState, setFollowState] = useState("");

  async function handleFollowShelter() {
    if (!item?.shelter?.id) {
      return;
    }

    setFollowing(true);
    setFollowState("");

    try {
      const result = await onToggleShelterFollow(item.shelter.id);
      setFollowState(result?.message || "");
    } catch (err) {
      setFollowState(err?.message || "Could not follow shelter.");
    } finally {
      setFollowing(false);
    }
  }

  return (
    <article className="card feed-card">
      <div className="feed-header">
        <div>
          <div className="badge">{typeLabel(item?.type)}</div>

          <div className="title-row">
            <h3 className="feed-title">{item?.title}</h3>
          </div>

          <div className="meta muted">
            <span>{item?.shelter?.name || "Unknown shelter"}</span>
            {time ? (
              <>
                <span className="dot">•</span>
                <span>{time}</span>
              </>
            ) : null}
          </div>
        </div>

        {item?.pet?.primaryPhotoUrl ? (
          <img
            className="thumb"
            src={item.pet.primaryPhotoUrl}
            alt={item.pet.name || "Pet"}
          />
        ) : (
          <div className="thumb placeholder" aria-hidden="true" />
        )}
      </div>

      {item?.body ? <p className="feed-body">{item.body}</p> : null}

      <div className="actions">
        {item?.pet?.id ? (
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/pets/${item.pet.id}`)}
          >
            View pet
          </button>
        ) : null}

        <button
          className="btn"
          onClick={handleFollowShelter}
          disabled={!item?.shelter?.id || following || !onToggleShelterFollow}
        >
          {following ? (isShelterFollowed ? "Unfollowing..." : "Following...") : (isShelterFollowed ? "Unfollow" : "Follow")}
        </button>
      </div>

      {followState ? <p className="meta muted">{followState}</p> : null}
    </article>
  );
}
