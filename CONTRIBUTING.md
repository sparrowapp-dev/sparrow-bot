# Contributing to Sparrow Bot

Thank you for considering contributing to Sparrow Bot! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template to create a new issue
- Include detailed steps to reproduce the bug
- Include any relevant logs or screenshots

### Suggesting Enhancements

- Check if the enhancement has already been suggested in the Issues section
- Use the feature request template to create a new issue
- Clearly describe the problem and solution
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add some feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Run in development mode: `npm run dev`

## Coding Guidelines

- Follow the TypeScript style guide
- Write tests for new features
- Update documentation for changes
- Follow the conventional commit format

## Testing

- Run tests with `npm test`
- Ensure all tests pass before submitting a PR
- Add new tests for new features or bug fixes

## Documentation

- Update the README.md with any necessary changes
- Document new features or changes in behavior
- Update API documentation if applicable

## Commit Messages

We use the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code changes that neither fix bugs nor add features
- test: Adding or updating tests
- chore: Changes to the build process or auxiliary tools

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation with details of changes if applicable
3. The PR should work for all supported Node.js versions
4. The PR will be merged once it receives approval from maintainers

## License

By contributing to Sparrow Bot, you agree that your contributions will be licensed under the project's MIT License.
