export default function Spinner({ size = 20, label = "Loading" }) {
  return (
    <span
      role="status"
      aria-label={label}
      className="spinner"
      style={{ width: size, height: size }} 
    />
  );
}
