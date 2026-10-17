# Contributing Guidelines

## 1. Before Contributing

Before making changes, contributors must:

- Have authorized access to the repository.
- Read this document and the project's Code of Conduct.
- Understand the applicable proprietary license and confidentiality obligations.
- Follow the project's security policies.
- Never commit credentials, secrets, private keys, or personal data.

## 2. Branching Strategy

Create a separate branch for each feature, bug fix, or maintenance task.

Use descriptive branch names such as:

- `feat/user-authentication`
- `fix/session-expiration`
- `refactor/api-client`
- `docs/setup-instructions`
- `chore/dependency-updates`

Avoid committing directly to protected branches unless explicitly authorized.

## 3. Commit Messages

Write concise, descriptive commit messages.

Recommended format:

`type: description`

Examples:

- `feat: add user registration`
- `fix: handle expired access tokens`
- `docs: update development instructions`
- `refactor: simplify request handling`
- `test: add authentication tests`
- `chore: update dependencies`

Keep commits focused on a single logical change whenever practical.

## 4. Pull Requests

Submit changes through a pull request when the project workflow requires review.

Every pull request should include:

- A clear explanation of the change.
- The reason the change is necessary.
- Relevant testing information.
- Any configuration or database migration implications.
- Potential breaking changes or security considerations.

Do not merge changes until the required reviews and checks have passed.

## 5. Code Quality

Contributors should:

- Follow existing project conventions.
- Prefer readable, maintainable code.
- Avoid unnecessary complexity and unrelated changes.
- Add or update tests where appropriate.
- Update documentation when behavior or configuration changes.
- Remove debugging code and unused dependencies.
- Handle errors appropriately.

Run the relevant formatter, linter, type checker, and tests before requesting review.

## 6. Security Requirements

Never commit:

- API keys or access tokens.
- Passwords or production credentials.
- Private keys or certificates containing secrets.
- Populated environment files.
- Sensitive customer or user data.

Use `.env.example` for documenting required environment variables without including real secret values.

Report vulnerabilities privately according to `SECURITY.md`. Do not disclose vulnerabilities through public issues or discussions.

## 7. Dependencies

Before adding a dependency:

- Confirm it is necessary.
- Review its maintenance status and security implications.
- Check its license and attribution requirements.
- Avoid introducing unnecessary or untrusted packages.

Update dependency lockfiles when required by the project's package manager.

## 8. Database and Configuration Changes

When introducing schema or configuration changes:

- Include necessary migrations.
- Document new environment variables.
- Consider backward compatibility.
- Avoid committing production data or environment-specific secrets.
- Explain deployment and rollback implications in the pull request.

## 9. Reviews and Ownership

Code owners and maintainers may request changes before approval.

Reviewers should focus on correctness, security, maintainability, and consistency with project requirements.

Repository access and contribution do not independently grant ownership of the product or permission to reuse its proprietary code.

Any required intellectual-property assignment or contributor agreement must be handled separately.

## 10. Merging and Releases

Only authorized maintainers may approve releases and production changes.

Follow the project's deployment procedures and ensure relevant checks pass before merging or releasing changes.

## 11. Questions

For questions about contributing, contact:

ayushyush100@gmail.com / [SECONDARY_PERSONEL_EMAIL]
