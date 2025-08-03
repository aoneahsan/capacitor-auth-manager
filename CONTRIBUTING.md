# Contributing to Capacitor Auth Manager

Thank you for your interest in contributing to Capacitor Auth Manager! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Git
- Basic knowledge of TypeScript
- Familiarity with Capacitor plugin development

### First Contribution

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a new branch** for your feature or bug fix
4. **Make your changes** and test them
5. **Submit a pull request** with a clear description

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aoneahsan/capacitor-auth-manager.git
cd capacitor-auth-manager
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Build the Project

```bash
# Clean build
npm run build

# Development build with watch
npm run watch
```

### 4. Run Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues
npm run lint --fix
```

### 5. Format Code

```bash
# Format all code
npm run prettier
```

## Contributing Guidelines

### Types of Contributions

We welcome the following types of contributions:

1. **Bug Reports** - Help us identify and fix issues
2. **Feature Requests** - Suggest new functionality
3. **Code Contributions** - Implement bug fixes or new features
4. **Documentation** - Improve or expand documentation
5. **Testing** - Add or improve test coverage
6. **Examples** - Provide usage examples for different frameworks

### Contribution Areas

#### 1. Authentication Providers

- Add support for new authentication providers
- Improve existing provider implementations
- Fix provider-specific bugs

#### 2. Platform Support

- Enhance iOS implementation
- Improve Android functionality
- Optimize web platform support

#### 3. Framework Integration

- Create framework-specific examples
- Develop helper libraries
- Improve integration guides

#### 4. Developer Experience

- Improve error messages
- Add better debugging tools
- Enhance TypeScript definitions

### Code Style

We follow these coding standards:

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code formatting is handled by Prettier
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Add JSDoc comments for public APIs

### Commit Messages

Use conventional commit messages:

```
type(scope): description

Examples:
feat(google): add support for additional scopes
fix(android): resolve token refresh issue
docs(api): update authentication guide
test(providers): add unit tests for apple provider
```

Types:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Maintenance tasks

## Pull Request Process

### 1. Before Creating a PR

- Ensure your code follows the project's coding standards
- Run tests and ensure they pass
- Update documentation if needed
- Check that your changes don't break existing functionality

### 2. Creating a Pull Request

1. **Create a clear title** describing the change
2. **Provide a detailed description** including:
   - What changes were made
   - Why the changes were necessary
   - Any potential breaking changes
   - Testing instructions

3. **Reference related issues** using keywords like "Fixes #123"

### 3. PR Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or clearly documented)
```

### 4. Review Process

- All PRs require review by project maintainers
- Address feedback and make requested changes
- Keep PR discussions focused and constructive
- Be patient - reviews may take time

## Issue Reporting

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Test with latest version** of the plugin

### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**

1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**

- Plugin version:
- Capacitor version:
- Platform (iOS/Android/Web):
- Framework (React/Vue/Angular):
- Device/Browser:

**Additional Context**
Any additional information.
```

### Feature Requests

Use the feature request template:

```markdown
**Feature Description**
Clear description of the proposed feature.

**Use Case**
Explain why this feature would be useful.

**Proposed Solution**
Your ideas for implementation.

**Alternatives Considered**
Other approaches you've considered.

**Additional Context**
Any additional information.
```

## Development Workflow

### Branch Naming

Use descriptive branch names:

```
feature/add-linkedin-provider
fix/android-token-refresh
docs/update-installation-guide
test/add-provider-tests
```

### Local Development

1. **Make changes** in your feature branch
2. **Test thoroughly** on all platforms
3. **Update documentation** as needed
4. **Run linting and formatting** before committing

### Testing Your Changes

```bash
# Run linting
npm run lint

# Run TypeScript compilation
npm run tsc

# Test build process
npm run build

# Test with example app (if available)
cd example && npm install && npm run build
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

- Write unit tests for new features
- Test edge cases and error conditions
- Use descriptive test names
- Group related tests using `describe` blocks

### Test Structure

```typescript
describe('GoogleAuthProvider', () => {
  beforeEach(() => {
    // Setup code
  });

  describe('signIn', () => {
    it('should successfully sign in with valid credentials', async () => {
      // Test implementation
    });

    it('should handle network errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

## Documentation

### Types of Documentation

1. **API Documentation** - Method signatures and usage
2. **Integration Guides** - Framework-specific guides
3. **Provider Guides** - Provider-specific setup
4. **Examples** - Working code examples
5. **Troubleshooting** - Common issues and solutions

### Documentation Guidelines

- Use clear, concise language
- Include code examples
- Test all code examples
- Keep documentation up to date
- Use consistent formatting

### Documentation Structure

```
docs/
├── README.md                    # Main documentation hub
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── platform-setup.md
├── api-reference/
│   ├── core-api.md
│   ├── auth-state.md
│   └── error-handling.md
├── providers/
│   ├── google.md
│   ├── apple.md
│   └── ...
├── examples/
│   ├── react.md
│   ├── vue.md
│   └── ...
└── guides/
    ├── best-practices.md
    ├── security.md
    └── ...
```

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions
- **Email** - aoneahsan@gmail.com for private matters

### Getting Help

- Check existing documentation
- Search GitHub issues
- Ask questions in GitHub Discussions
- Contact maintainers if needed

### Helping Others

- Answer questions in issues and discussions
- Review pull requests
- Improve documentation
- Share examples and use cases

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **Major** (x.0.0) - Breaking changes
- **Minor** (0.x.0) - New features, backward compatible
- **Patch** (0.0.x) - Bug fixes, backward compatible

### Release Checklist

For maintainers:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build and test distribution files
5. Create release notes
6. Tag release and push to GitHub
7. Publish to npm

## Recognition

### Contributors

All contributors are recognized in:

- GitHub contributors list
- Release notes
- Documentation credits

### Types of Recognition

- **Code Contributors** - Feature and bug fix implementations
- **Documentation Contributors** - Documentation improvements
- **Community Contributors** - Support and discussions
- **Testing Contributors** - Testing and QA efforts

## License

By contributing to Capacitor Auth Manager, you agree that your contributions will be licensed under the MIT License.

## Questions?

If you have questions about contributing, please:

1. Check this document first
2. Search existing issues and discussions
3. Create a new discussion if needed
4. Contact maintainers directly if necessary

Thank you for contributing to Capacitor Auth Manager! Your efforts help make authentication easier for developers worldwide.

---

**Maintainer**: [Ahsan Mahmood](https://aoneahsan.com)  
**License**: MIT  
**Repository**: [GitHub](https://github.com/aoneahsan/capacitor-auth-manager)

_This project is open source and created for the developer community._
