export function Signup() {
  return (
    <div>
      <h1>Revolutionary Design Audit Platform</h1>
      <p>
        We leverage cutting-edge synergies to empower your team with
        world-class insights that are delivered seamlessly in real-time.
      </p>
      <form>
        <input type="text" placeholder="you@example.com" />
        <input type="password" placeholder="password" />
        <p>Choose a plan:</p>
        <input type="radio" name="plan" value="free" id="plan-free" /> Free
        <input type="radio" name="plan" value="pro" id="plan-pro" /> Pro
        <button type="submit">Click here</button>
      </form>
    </div>
  );
}
