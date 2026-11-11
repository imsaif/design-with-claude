export function TrialSignup() {
  return (
    <form action="/api/trial" method="post">
      <h2>Start your free trial</h2>
      <input name="firstName" placeholder="First name" required />
      <input name="lastName" placeholder="Last name" required />
      <input name="email" type="email" placeholder="Work email" required />
      <input name="phone" placeholder="Phone number" required />
      <input name="company" placeholder="Company" required />
      <select name="companySize" required>
        <option value="">Company size</option>
        <option>1-10</option><option>11-50</option><option>51-200</option><option>200+</option>
      </select>
      <input name="jobTitle" placeholder="Job title" required />
      <select name="source" required>
        <option value="">How did you hear about us?</option>
        <option>Search</option><option>Friend</option><option>Event</option>
      </select>
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Submit</button>
    </form>
  );
}
