import mongoose from 'mongoose';

// One document per login session; its _id is the session id (sid).
// Only the SHA-256 hash of the refresh token is stored, never the raw token.
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    // The session that replaced this one when the token was rotated.
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
      default: null,
    },
  },
  { timestamps: true },
);

// MongoDB deletes each session once expiresAt passes (the TTL monitor runs about every 60s).
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
