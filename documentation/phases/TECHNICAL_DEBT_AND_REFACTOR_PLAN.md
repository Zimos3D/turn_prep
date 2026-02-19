# Technical Debt & Refactoring Plan

This document outlines a comprehensive plan to audit, clean up, document, and restructure the `turn-prep` codebase. The primary goals are to pay off technical debt, ensure the maintainer understands the entire codebase, and prepare the project architecture for supporting additional sheet types (NPC sheets, Default 5e sheets).

## Phase 1: Audit & Cleanup

**Goal:** Remove unused code, files, and dependencies to reduce noise and confusion.

1.  **Deprecated Feature Removal** (High Priority)
    - [ ] **Turn History Snapshots:** Remove code related to snapshots of turn history and initiative tracker tying (if unused).
    - [ ] **Chat Parsing:** Remove logic for parsing Foundry Chat to derive roll data.
    - [ ] **Popup Dialogs:** Remove the "Multiple Activities" dialog logic (features are now added in entirety).
    - [ ] **Settings:** Remove module settings associated with snapshots, chat parsing, or history tracking.
    - [ ] **Documentation:** Scrub planning docs of references to these abandoned features.

2.  **Orphaned File Audit**
    - [ ] List all files in `src/`.
    - [ ] Identify files that are not imported by any other active file (excluding entry points like `main.ts`).
    - [ ] Review identified files: Delete if truly unused, or document if they are reference/future code.
2.  **Unused Export/Import Cleanup**
    - [ ] Scan for unused exports in utility and feature files.
    - [ ] Remove unused imports to keep file dependencies clean.
3.  **Console Log Cleanup**
    - [ ] Review codebase for `console.log` statements used for debugging.
    - [ ] converting necessary logs to the module's logger utility or removing them.
4.  **TODO & Comment Review**
    - [ ] Search for `TODO`, `FIXME`, or temporary comments in the code.
    - [ ] Resolve them or convert them into formal issues/tasks in `documentation/TODO.md`.

## Phase 2: Structural Reorganization

**Goal:** Organize code to explicitly support the four target sheet types: Tidy 5e PC, Tidy 5e NPC, Default PC, and Default NPC.

1.  **Sheet Directory Restructuring**
    - Current Structure:
        ```text
        src/sheets/
          tidy5e/
          default/
        ```
    - Proposed Structure:
        ```text
        src/sheets/
          tidy5e-pc/       (Move current tidy5e PC code here)
          tidy5e-npc/      (Placeholder for future)
          default-pc/      (Move current default sheet code here)
          default-npc/     (Placeholder for future)
          shared/          (Code shared between multiple sheets)
        ```
    - [ ] Create new directories.
    - [ ] Move existing files to their specific folders (`tidy5e` -> `tidy5e-pc`).
    - [ ] Update all import paths.
2.  **Asset Organization**
    - [ ] Ensure `public/assets` and styles are organized in a way that aligns with the new sheet structure if necessary (e.g., sheet-specific CSS).

## Phase 3: Logic Abstraction & Refactoring

**Goal:** Ensure logic is separated from presentation so it can be shared across different sheets (PC vs NPC, Tidy vs Default).

1.  **Feature Extraction**
    - [ ] Review `tidy5e-pc` code for logic that should be generic (e.g., turn tracking logic, action filtering).
    - [ ] Move generic logic to `src/features/` or `src/sheets/shared/` if it's UI-related but shared.
2.  **Component Review**
    - [ ] Identify Svelte components that are "Generic" (can be used on any sheet) vs "Specific" (tightly coupled to a specific sheet's HTML/CSS).
    - [ ] Move generic components to `src/components/shared/` or similar.
3.  **NPC vs PC Logic Separation**
    - [ ] Analyze `src/features` to ensure data handling can support NPC actors (which may have different data structures than PCs).
    - [ ] Refactor interfaces/types to be polymorphic where needed (e.g., `Actor5e` vs `CharacterData`).

## Phase 4: Documentation & Knowledge Transfer

**Goal:** Ensure every part of the codebase is understood and documented for maintenance.

1.  **JSDoc & Inline Documentation**
    - [ ] Add JSDoc comments to all exported functions, classes, and interfaces.
    - [ ] Add comments explaining *complex* logic blocks (the "why", not just the "how").
2.  **Architecture Walkthrough**
    - [ ] Create `documentation/overview/CODE_WALKTHROUGH.md`.
    - [ ] Document the data flow: Foundry Hook -> Sheet Render -> Turn Prep Injection -> User Action -> Update.
3.  **"How To" Guides**
    - [ ] Update `documentation/overview/BUILD_GUIDE.md` if build steps change.
    - [ ] Create a guide for "Adding a New Sheet Support" (e.g., what files to touch to add `tidy5e-npc`).

## Execution Strategy

We will tackle these phases sequentially.
- **Phase 1** is safe and low-risk.
- **Phase 2** requires careful import updates but is critical for the "Mental Model" of the project.
- **Phase 3** is the deep coding work.
- **Phase 4** can be done iteratively alongside the others or as a final polish.

**Immediate Next Step:** Should we begin with Phase 1 (Cleanup) or jump straight to Phase 2 (Restructuring) to get the folders right first?
