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
  const d = new Date(isoString);
  return d.toLocaleString();
}

export default function FeedItemCard({ item }) {
return (
    <article className="card feed-card">
        <div className="feed-header">
            <div>
                <div className="badge">{typeLabel(item.type)}</div>
                <div className="title-row">
                    <h3 className="feed-title">{item.title}</h3>
                </div>
                <div className="meta muted">
                    <span>{item.shelter?.name || "Unknown shelter"}</span>
                    <span className="dot">•</span>
                    <span>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>

            {item.pet?.primaryPhotoUrl ? (
                <img className="thumb" src={item.pet.primaryPhotoUrl} alt={item.pet.name || "Pet"} />
            ) : (
                <div className="thumb placeholder" aria-hidden="true" />
            )}
        </div>

        {item.body ? <p className="feed-body">{item.body}</p> : null}

        <div className="actions">
            {item.pet?.id ? (
                <button className="btn btn-secondary" onClick={() => alert(`Go to /pets/${item.pet.id}`)}>
                    View pet
                </button>
            ) : null}

            <button className="btn" onClick={() => alert(`Follow shelter ${item.shelter?.id || ""}`)}>
                Follow shelter
            </button>
        </div>
    </article>
);
}
