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
    <div className="page">
      <h1>Messages</h1>

      {conversations.length === 0 ? (
        <div className="empty-state">
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
        <div className="conversation-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => navigate(`/conversations/${conversation.id}`)}
              className={`conversation-card ${
                Number(conversation.unread_count) > 0 ? "conversation-unread" : ""
              }`}
            >
              <h3>
                {isShelterAdmin
                  ? conversation.adopter_username || conversation.username || "Adopter"
                  : conversation.shelter_name || "Conversation"}

                {Number(conversation.unread_count) > 0 && (
                  <span className="conversation-dot"></span>
                )}
              </h3>

              <p className="conversation-preview">
                {conversation.last_message || "No messages yet"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Conversations;