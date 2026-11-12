"use client";

import { useState } from "react";

export default function SignupPage() {
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!String(data.get("phone") ?? "").match(/^\+?\d{10,14}$/)) {
      setError("You entered an invalid phone number. Please enter it correctly.");
      return;
    }
    window.location.href = "/onboarding";
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Create your account</h1>
      <label htmlFor="name">Business name</label>
      <input id="name" name="name" required />
      <label htmlFor="email">Work email</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="phone">Mobile number</label>
      <input id="phone" name="phone" type="tel" required />
      <label htmlFor="vat">VAT number</label>
      <input id="vat" name="vat" required />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Create account</button>
    </form>
  );
}
