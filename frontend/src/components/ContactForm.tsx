import React, { useState } from "react";

const ContactForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section className="card">
      <h2>Contact / Feedback</h2>
      <form
        className="contact-form"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Thanks for your message! (Hook this to backend later.)");
          setName("");
          setEmail("");
          setMessage("");
        }}
      >
        <div className="form-row">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            rows={4}
            placeholder="Share feedback or report an issue..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button className="btn" type="submit">
          Send Message
        </button>
      </form>
    </section>
  );
};

export default ContactForm;

