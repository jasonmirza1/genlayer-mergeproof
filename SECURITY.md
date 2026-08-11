# Security

## Reporting

Please open a private security advisory in the GitHub repository. Do not publish wallet credentials or active secrets in an issue.

## Trust boundaries

- GitHub issue, pull-request, comment, commit, and code text is untrusted. The validator prompt treats it only as evidence and rejects embedded instructions.
- Only canonical public GitHub HTTPS issue and pull-request URLs are accepted, and both must belong to the same repository.
- Weak, unavailable, unmerged, or contradictory evidence cannot release escrow.
- Contract state prevents duplicate payout and prevents sponsor refunds while a submission is awaiting judgment or after release.

## Credentials

`.env` and frontend environment files are ignored. Only placeholder values belong in `.env.example` files. Never commit a private key, API key, seed phrase, or wallet export.
