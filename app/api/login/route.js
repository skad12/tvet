// pages/api/sign-in.js
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { username } = req.body || {};

  let account_type = "customer";
  if (username && username.includes("@admin")) account_type = "admin";
  else if (username && username.includes("@agent")) account_type = "agent";

  const user = {
    username,
    email: username,
    account_type,
    name:
      account_type === "admin"
        ? "Site Admin"
        : username?.split?.("@")?.[0] ?? "User",
  };

  res.status(200).json(user);
}
