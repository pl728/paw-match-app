import FeedItemCard from "./FeedItemCard.jsx";

export default function FeedList({ items, followedShelterIds, onToggleShelterFollow }) {
  return (
    <div className="stack">
      {items.map((item) => (
        <FeedItemCard
          key={item.id}
          item={item}
          isShelterFollowed={followedShelterIds.includes(item?.shelter?.id)}
          onToggleShelterFollow={onToggleShelterFollow}
        />
      ))}
    </div>
  );
}
