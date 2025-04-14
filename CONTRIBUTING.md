
# Contributing to server-side-template-for-gtm-v2-client
Thank you for your interest in contributing to `server-side-template-for-gtm-v2-client`! We value your time and effort to make this project better. This document outlines the guidelines and security best practices for contributing to this repository.

## Security and Compliance Guidelines

This repository follows strict security protocols to protect sensitive information and ensure code quality. Please adhere to the following guidelines:

### 1. Sensitive Information
- Do not include any hard-coded credentials, sensitive information, or deployment details in your contributions.
- Ensure that your commits and pull requests do not reference internal systems or private repositories.

### 2. Signed Commits
- All commits must be signed using GPG to verify authenticity.
  - Generate a GPG key with a key size of 4096 and no expiration.
  - Use your official email address (e.g., `you@domain.com`) when generating the key.
  - Refer to GitHub’s [guide on signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits) for instructions.

### 3. Push and Branch Protections
- Contributions should be made via pull requests; direct pushes to the main branch are not allowed.
- All pull requests must pass branch protection rules, including code review and CI checks.

### 4. Vulnerability Reporting
- If you discover a vulnerability, please use the [Private Vulnerability Reporting](https://docs.github.com/en/code-security/repository-security-advisories/privately-reporting-a-security-vulnerability) feature to report it securely.
- Public discussion of vulnerabilities is prohibited until a fix is deployed.

### 5. Code Review
- All contributions from external users must be reviewed by at least two maintainers or approved developers from our team.
- Ensure pull requests include tests and documentation for new features or changes.

### 6. Secret Scanning
- This repository has secret scanning and push protection enabled.
- Contributions containing sensitive information (e.g., API keys or passwords) will be automatically rejected.

### 7. PR Guidelines
- Do not include links to testing environments or sensitive internal documentation in your pull request comments or descriptions.
- Write clear and concise commit messages and PR descriptions.

---

## How to Contribute

1. **Fork the Repository**
   - Fork the repository to your own GitHub account and clone it locally.

2. **Create a Feature Branch**
   - Create a branch for your changes using the naming convention `feature/<feature-name>` or `bugfix/<issue-number>`.

3. **Make Changes**
   - Write clean and documented code.
   - Test your changes locally to ensure they work as expected.

4. **Submit a Pull Request**
   - Push your branch to your fork and open a pull request to the main repository.
   - Provide a detailed description of your changes and reference any related issues.

---

## Licensing

By contributing to this repository, you agree that your contributions will be licensed under the same license as the repository. For more details, see [LICENSE](LICENSE).

---

For any questions or further clarification, feel free to open an issue or contact the maintainers.
