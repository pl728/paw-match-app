import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

function Chat({ conversationId, shelterName = "Shelter" }) {
  const params = useParams();
  const id = conversationId || params.id;
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");

  const currentUserId = user?.id;

  useEffect(() => {
    if (!id) return;

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

    if (!body.trim() || !id) return;

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

    setMessages((prev) => [...prev, newMessage]);
    setBody("");
  };

  return (
    <div className="chat-page">
      <h1>Chat with {shelterName}</h1>

      <div className="chat-messages">
        {messages.map((message) => {
          const isMine = message.sender_user_id === currentUserId;

          return (
            <div
              key={message.id}
              className={`chat-row ${isMine ? "mine" : "theirs"}`}
            >
              <div className={`chat-bubble ${isMine ? "mine" : "theirs"}`}>
                {message.body}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />

        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;