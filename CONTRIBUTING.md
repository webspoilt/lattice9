# Contributing to HAWK

Thank you for your interest in contributing to HAWK! We welcome contributions from the security community to help improve the engine's intelligence and recon capabilities.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs
- Check the [Issue Tracker](https://github.com/webspoilt/hawk-pentest-platform/issues) to see if the bug has already been reported.
- If not, open a new issue with a clear title, description, and steps to reproduce.

### Suggesting Features
- We welcome ideas for new analysis modules, recon tools, or UI improvements.
- Open an issue with the `enhancement` label to discuss your proposal.

### Pull Requests
1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Ensure your code follows the existing style and is well-documented.
4. Submit a pull request with a detailed description of your changes.

## Development Setup

### Engine (Python)
```bash
cd server-py
pip install -r requirements.txt
# Run tests
pytest
```

### Dashboard (Node/React)
```bash
pnpm install
# Run tests
pnpm test
```

## Commit Message Policy
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Please ensure your commit messages are accurate, concise, and follow the project's established standards.
