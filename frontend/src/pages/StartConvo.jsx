import { useNavigate } from "react-router-dom";

function StartConvo({ pet }) {
  const navigate = useNavigate();

  const startConvo = async () => {
    const storedAuth = JSON.parse(localStorage.getItem("pawmatch_auth"));
    const token = storedAuth?.token;

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shelter_id: pet.shelter_id || pet.shelter?.id,
        pet_id: pet.id,
      }),
    });

    const convo = await res.json();

    if (!res.ok) {
      console.error("Failed to start conversation:", convo);
      return;
    }

    navigate(`/conversations/${convo.id}`);
  };

  return (
    <button
      onClick={startConvo}
      style={{
        marginTop: "12px",
        padding: "12px 18px",
        borderRadius: "10px",
        border: "none",
        background: "#6FCF97",
        color: "#0b0c10",
        fontWeight: "700",
        fontSize: "1rem",
        cursor: "pointer",
      }}
    >
      🐾 Let&apos;s Match!
    </button>
  );
}

export default StartConvo;
