import User from '../models/user.model.js';

export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });

  // List responses put the array directly in data (see "Response shapes" in the README).
  res.json({ success: true, data: users });
}
