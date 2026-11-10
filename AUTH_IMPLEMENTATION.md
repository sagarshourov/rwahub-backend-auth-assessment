# Authentication scope implementation

- Email register/login now uses `/api/auth/register` and `/api/auth/login`, not frontend mocks.
- Wallet sign in requires a server-generated 5-minute challenge, `personal_sign`, and server `ethers.utils.verifyMessage`. Challenge consumed on verification (one-use, no replay).
- Verified bearer JWT resolves a currently present server user; unsigned, invalid, expired, and nonexistent-user sessions receive `401`.
- `POST /api/assets` requires JWT and sets `owner` and `ownerId` using `req.user` only. Client-supplied `status` and `isVerified` cannot grant verification.
- Frontend stores JWT in memory (reload requires reauthentication); protected asset POST sends bearer token, displays unauthorized error, and only changes UI after successful save.
- Demo backend uses an in-memory database: identities and nonces are lost on server restart; do not use this implementation as a production persistent authentication store.

## Run / verify

1. `cp example.env .env` and set a strong `JWT_SECRET` (never commit `.env`).
2. `npm ci` then `npm run test:auth`.
3. `npm run dev`; Sign In via wallet (approve signature) or register/login via `/api/auth` endpoints.
4. Create an asset from existing Tokenize page. Inspect network for `Authorization: Bearer ...` and `201`.
5. Refresh (clears in-memory session); submit again and confirm UI shows `401 Unauthorized`.

No Solidity or Hardhat files were edited.
