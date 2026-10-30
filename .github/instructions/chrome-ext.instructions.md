---
applyTo: "**/*.ts,**/*.tsx"
---

# Project Overview

This project is a Chrome Extension designed to help users improve discipline by limiting access to distracting or harmful websites. Instead of directly accessing blocked sites, users are presented with a Qur’an verse and must engage with it (by reading or listening to the audio) before they can proceed.

The goal is to encourage mindfulness, reflection, and spiritual growth while reducing unproductive browsing habits.

The extension is built using React, Vite, and Tailwind CSS.

## Core Features

- Block user-defined websites (e.g., social media, distracting platforms).
- Display a Qur’an verse when a blocked site is accessed.
- Provide verse audio playback.
- Require user interaction (e.g., reading confirmation or listening to audio) before unblocking.
- Allow users to manage their blocked site list.

## Folder Structure

- `/src`: Main source code.

## Libraries and Frameworks

- React (UI)
- Vite (build tool)
- Tailwind CSS (styling)

## Coding Standards

- Use semicolons at the end of each statement.
- Use single quotes for strings.
- Use functional React components.
- Use arrow functions for callbacks.
- Prefer modular and reusable components.

## UI Guidelines

- Design should feel calm, minimal, and spiritually aligned.
- Avoid overly flashy or distracting elements.
- Use typography and spacing to emphasize readability of Qur’an verses.
- Use Tailwind theme configuration (no hardcoded styles).
- Ensure accessibility (readable font sizes, contrast, audio controls).

## UX Principles

- The experience should feel encouraging, not punishing.
- Avoid aggressive or frustrating blocking behavior.
- Provide clear guidance on how to unlock access.
- Keep interactions simple (e.g., “Play audio” or “Mark as read”).
- Reinforce positive habits and reflection.

## Code Style Guidelines

- Use ESLint and Prettier.
- Follow Airbnb style guide as a base.
- Maintain consistent formatting and structure.
- Use meaningful and descriptive naming.

## Performance Guidelines

- Keep the extension lightweight and fast.
- Minimize background script overhead.
- Avoid unnecessary re-renders in React.
- Optimize content script execution.

## Application Health

- Code must be clean, maintainable, and well-structured.
- Prefer simplicity over over-engineering.
- All changes can be treated as breaking changes (no backward compatibility assumption).

## Security Guidelines

- Validate and sanitize all user inputs (especially URLs).
- Use Chrome Extension APIs securely.
- Avoid exposing sensitive data.
- Store settings safely using Chrome storage APIs.

## Additional Notes

- Qur’an content should be handled respectfully and accurately.
- Ensure audio playback works reliably across browsers.
- Consider offline fallback if API is unavailable.
