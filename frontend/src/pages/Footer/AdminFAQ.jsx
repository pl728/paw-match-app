import { useState } from "react";

const adminFaqs = [
  {
    question: "How do I add a new pet?",
    answer:
      "After creating a shelter, go to the 'Add Pet' page and fill out the pet’s details such as name, species, breed, and description. Once submitted, the pet will appear in listings.",
  },
  {
    question: "How do I submit my shelter?",
    answer:
      "Click 'Add Pet' and, if you are not already a part of a shelter, you will have the option to create one.",
  },
  {
    question: "How do I mark a pet as adopted?",
    answer:
      "Edit the pet’s status by navigating to your profile, selecting 'Pets' and changing its status. This will update its visibility and notify users through the feed.",
  },
  {
    question: "Why can’t I see my pet in the feed?",
    answer:
      "Make sure the pet was successfully created and has valid details. Some updates may take a moment to appear in the activity feed.",
  },
  {
    question: "What does the activity feed do for shelters?",
    answer:
      "The feed automatically posts updates when you add pets, change statuses, or upload photos. This helps adopters stay informed.",
  },
  {
    question: "Can I delete a pet listing?",
    answer:
      "Depending on your system setup, you may be able to remove or deactivate a pet listing from your management page.",
  },
  {
    question: "What should I do if something isn’t working?",
    answer:
      "Try refreshing the page. If the issue continues, log out and log back in or check your connection.",
  },
];

export default function AdminFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  function toggleFAQ(index) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="page">
      <div>
        <h1>Admin FAQ</h1>
        <p className="muted">Learn how to use the website.</p>
      </div>

      <div className="stack">
        {adminFaqs.map((faq, index) => (
          <div className="card" key={faq.question}>
            <button
              className="faq-button"
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