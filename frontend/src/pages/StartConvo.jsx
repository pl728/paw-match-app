import { useState } from "react";
import Chat from "./Chat.jsx";

function StartConvo({ pet }) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [shelterName, setShelterName] = useState("");

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

    // 🔍 DEBUG (you can remove later)
    console.log("pet:", pet);
    console.log("convo:", convo);

    setConversationId(convo.id);

    // ✅ safer fallback for different field names
    const name =
      pet.shelter_name ||
      pet.shelterName ||
      pet.shelter?.name ||
      pet.shelter?.shelter_name ||
      convo.shelter_name ||
      "Shelter";

    setShelterName(name);
    setOpen(true);
  };

  return (
    <>
      <button className="match-btn" onClick={startConvo}>
        🐾 Let&apos;s Match!
      </button>

      {open && (
        <>
          <div
            className="dialog-overlay"
            onClick={() => setOpen(false)}
          />

          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()} // prevents closing when clicking inside
          >
            <Chat
              conversationId={conversationId}
              shelterName={shelterName}
            />

            <div className="dialog-actions">
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default StartConvo;