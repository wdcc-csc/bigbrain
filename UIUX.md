# UIUX.md - User Interface and Experience Enhancements

This document outlines the UI/UX strategies implemented in the project based on the actual frontend code.

---

## 1.1 Clear Navigation Structure
- Implemented in `Navbar.jsx`.
- Uses Material UI's `AppBar` and `Toolbar` for a consistent top navigation.
- Displays navigation items conditionally based on authentication.
- Dropdown menu under Avatar includes Logout functionality.

## 1.2 Context-Aware Routing
- Configured in `App.jsx` using React Router.
- Pages such as `/dashboard` and `/game/:gameId` are wrapped in `<ProtectedRoute>`.
- Redirects unauthenticated users to `/login`.

## 1.3 Responsive Layout and Components
- Uses Material UI layout components like `<Grid>`, `<Box>`, and `<Paper>`.
- Consistent styling with spacing (`sx={{ p: 2 }}`) across all views.
- Ensures layout adapts well to different screen sizes.

## 1.4 Form Usability and Validation
- Present in `Login.jsx`, `Register.jsx`, `JoinGame.jsx`.
- All form fields are labeled with `<TextField label=...>`.
- Basic client-side validation shows Snackbar alerts if inputs are missing.
- Submit buttons use `type="submit"` to support enter-key submissions.

## 1.5 Real-Time Feedback
- Used extensively in all form-based pages.
- Implements `<Snackbar>` and `<Alert>` components to provide immediate success or error feedback.
- Alerts are dismissible and appear for actions like login failure or empty form fields.

## 1.6 Session Feedback with Dialogs
- Implemented in `SessionAdmin.jsx`.
- A `<Dialog>` asks users if they want to view results after a session ends.
- Includes `Yes` and `No` buttons with keyboard accessibility.

## 1.7 Visual Consistency and Branding
- Theme defined in `App.jsx` using `createTheme()`.
- Primary color: `#2196f3` (blue), Secondary color: `#f50057` (pink).
- Consistent use of Material UI components enhances UI uniformity.

## 1.8 Language Adaptation Support
- Global `t()` function used for text rendering across all components.
- `LanguageContext.jsx` maintains the current language.
- Although currently English-only, full infrastructure exists for i18n.

---

These enhancements make the application visually consistent, responsive, accessible, and user-friendly, meeting the criteria set out in the course UI/UX guidelines.