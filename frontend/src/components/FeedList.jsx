import FeedItemCard from "./FeedItemCard.jsx";

export default function FeedList({ items }) {
  return (
    <div className="stack">
      {items.map((item) => (
        <FeedItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
