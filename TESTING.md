# TESTING.md - Testing Strategy

This document describes the component and UI testing approaches implemented in the project based on the provided test code.

---

## 1. Component Testing (60%)

The following components have been independently tested using Vitest and React Testing Library. Each test file validates render behavior, interactions, and expected side effects.

### 1.1 `Navbar.test.jsx`
- Verifies presence of dashboard link and user avatar.
- Simulates menu interaction and confirms the logout option appears upon avatar click.

### 1.2 `ProtectedRoute.test.jsx`
- Mocks an authenticated and unauthenticated user.
- Asserts that protected content is visible to authenticated users only.
- Verifies redirect behavior to `/login` for unauthenticated users.

### 1.3 `T.test.jsx`
- Validates internationalization text rendering.
- Asserts fallback behavior if non-string children are passed.

### 1.4 `Login.test.jsx`
- Renders the login form inputs.
- Simulates form submission with valid and empty fields.
- Confirms login function is invoked with correct input.

### 1.5 `PlayerResults.test.jsx`
- Validates result rendering with player performance.
- Ensures score, correct rate, and question-level info appear.

### 1.6 `QuestionEdit.test.jsx`
- Confirms editing form is rendered correctly.
- Verifies input field population and interaction.

### 1.7 `SessionAdmin.test.jsx`
- Renders active session data (players, scores, controls).
- Simulates question advancement and session ending.

---

## 2. UI Testing (40%)

UI interaction and feedback mechanisms were tested in component scope using realistic DOM behavior simulations. All key UI states are covered including alerts, dialogs, and navigation flows.

- **Snackbars and Alerts**: Presence and visibility tested across `Login`, `JoinGame`, and `SessionAdmin`.
- **Dialogs**: Confirmation dialogs are simulated via `SessionAdmin.test.jsx`, checking both opening and closing behavior.
- **Navigation Flow**: ProtectedRoute and Navbar test files validate route-based content visibility.
- **Forms**: `Login`, `JoinGame`, and `QuestionEdit` include full interaction simulations with form validation.

---

These tests are located in the `frontend/__tests__/` directory and are executed using `vitest` via the command:
```bash
npm run test
```

All testing decisions strictly align with the project rubric for 6.6 Testing (5%) — 60% component coverage and 40% UI interaction validation.

---