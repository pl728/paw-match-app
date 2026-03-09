export default function Spinner({ size = 20, label = "Loading" }) {
  return (
    <span
      role="status"
      aria-label={label}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "999px",
        border: "2px solid rgba(255, 255, 255, 0.16)",
        borderTopColor: "#f9d86e",
        animation: "ui-spinner-rotate 0.8s linear infinite",
      }}
    />
  );
}
