import { useState } from "react";

const faqs = [
  {
    question: "How do I find pets to adopt?",
    answer:
      "Go to the 'Pets' page via the nav bar at the top to browse available pets. You can scroll through listings and click on any pet to see more details.",
  },
  {
    question: "How do I favorite a pet?",
    answer:
      "Click the favorite button on a pet card from the 'Pets' page. This saves the pet so you can easily find it later!",
  },
  {
    question: "Where can I see my favorited pets?",
    answer:
      "You can view all your saved pets via the nav bar at the top of the page.",
  },
  {
    question: "How do I follow a shelter?",
    answer:
      "Click the follow button on a shelter or from a feed item. Following a shelter lets you see their updates in your feed.",
  },
  {
    question: "What does the activity feed show?",
    answer:
      "The feed shows updates from shelters, including new pets, status changes, and other activity related to adoption.",
  },
  {
    question: "Why am I not seeing anything in my feed?",
    answer:
      "Try following some shelters first. If you are not following any, your feed may be empty.",
  },
  {
    question: "How do I refresh the feed?",
    answer:
      "Click the refresh button at the top of the feed page to load the latest updates.",
  },
  {
    question: "What should I do if something isn’t working?",
    answer:
      "Try refreshing the page first. If the issue continues, log out and log back in.",
  },
];

export default function UserFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  function toggleFAQ(index) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>User FAQ</h1>
          <p className="muted">
            Help for adopters using Paw Match.
          </p>
        </div>
      </div>

      <div className="stack">
        {faqs.map((faq, index) => (
          <div className="card" key={faq.question}>
            <button
              className="btn faq-button"
              onClick={() => toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              <span>{openIndex === index ? "−" : "+"}</span>
            </button>

            {openIndex === index && (
              <p className="muted faq-answer">
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}