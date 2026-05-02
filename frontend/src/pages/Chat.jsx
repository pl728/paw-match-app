import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

function Chat() {
  const { id } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");

  const currentUserId = user?.id;

useEffect(() => {
  const storedAuth = JSON.parse(localStorage.getItem("pawmatch_auth"));
  const token = storedAuth?.token;

  fetch(`/api/conversations/${id}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        console.error("Error loading messages:", data);
        setMessages([]);
      }
    })
    .catch((err) => console.error("Error loading messages:", err));
}, [id]);


  const sendMessage = async (e) => {
    e.preventDefault();

    if (!body.trim()) return;

    const storedAuth = JSON.parse(localStorage.getItem("pawmatch_auth"));
    const token = storedAuth?.token;

    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        body: body,
      }),
    });

    const newMessage = await res.json();

    if (!res.ok) {
      console.error("Failed to send message:", newMessage);
      return;
    }

    setMessages([...messages, newMessage]);
    setBody("");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1>Chat</h1>

      <div>
        {messages.map((message) => {
          const isMine = message.sender_user_id === currentUserId;

          return (
            <div
              key={message.id}
              style={{
                textAlign: isMine ? "right" : "left",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: isMine ? "#d1f5d3" : "#eee",
                  color: "#0b0c10",
                  maxWidth: "70%",
                }}
              >
                {message.body}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          style={{
            width: "75%",
            padding: "10px",
          }}
        />

        <button type="submit" style={{ padding: "10px" }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
