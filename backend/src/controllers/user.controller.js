import User from '../models/user.model.js';

export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });

  res.json({ success: true, data: { users } });
}
