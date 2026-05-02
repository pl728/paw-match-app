import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";


function Conversations() {
  const [conversations, setConversations] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isShelterAdmin = user?.role === "shelter_admin";

useEffect(() => {
  const storedAuth = JSON.parse(localStorage.getItem("pawmatch_auth"));
  const token = storedAuth?.token;

  fetch("/api/conversations", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error("Error loading conversations:", data);
        setConversations([]);
      }
    })
    .catch((err) => console.error("Error loading conversations:", err));
}, []);


  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1>Messages</h1>

      {conversations.length === 0 ? (
        <div style={{ marginTop: "20px" }}>
          {isShelterAdmin ? (
            <>
              <h3>No adopter messages yet.</h3>
              <p>
                When adopters message your shelter, conversations will show up here.
              </p>
            </>
          ) : (
            <>
              <h3>No messages yet.</h3>
              <p>
                Find a pet and click <strong>Let&apos;s Match!</strong> to start chatting.
              </p>

              <Link to="/browse-pets">Browse Pets</Link>
            </>
          )}
        </div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => navigate(`/conversations/${conversation.id}`)}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "10px",
              cursor: "pointer",
              borderRadius: "8px",
            }}
          >
            <h3>{conversation.shelter_name || "Conversation"}</h3>
            <p>{conversation.last_message || "No messages yet"}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Conversations;
