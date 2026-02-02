# Turn Prep Build Guide

This guide describes how to set up your development environment to build and work on the **Turn Prep** module.

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: You need a recent version of Node.js. The project uses modern features. We recommend the latest LTS version (Node 22 or newer).
    *   Download: [https://nodejs.org/](https://nodejs.org/)
    *   To verify installation, run `node --version` and `npm --version` in your terminal.

2.  **Foundry VTT**: This module is designed for Foundry VTT. You should have it installed locally to test the module.

## Setup Instructions

Follow these steps to get your environment ready:

1.  **Clone the Repository**
    If you haven't already, clone the repository to your local machine.
    ```bash
    git clone <repository-url>
    cd turn_prep
    ```

2.  **Install Dependencies**
    This is the most critical step to avoid "command not found" errors (like the `vite` error). Run the following command in the root of the project folder:
    ```bash
    npm install
    ```
    This downloads all the necessary libraries and tools (including Vite, Svelte, TypeScript) defined in `package.json` into a `node_modules` folder.

## Building the Project

To compile the TypeScript and Svelte code into a module that Foundry can load:

1.  Run the build command:
    ```bash
    npm run build
    ```
    *   This will create a `dist/` directory containing the compiled module files.

## Linking to Foundry VTT

To test the module in Foundry, you need to link your build folder to Foundry's `Data/modules` directory.

1.  **Create Symlink**
    Run the included helper script:
    ```bash
    npm run link-create
    ```
    *   **Note**: This script assumes a standard Foundry installation path on Windows (`%LocalAppData%\FoundryVTT\Data\modules`).
    *   If successful, you will see a message confirming the symlink was created.

2.  **Verify**
    *   Open Foundry VTT.
    *   Check your "Add-on Modules" tab. **Turn Prep** should now appear in the list.
    *   Launch a world and enable the module.

## Development Workflow

For active development, you can use the dev server:

```bash
npm run dev
```

*   This starts Vite in watch mode.
*   Note that for Foundry to pick up changes, you typically need to refresh the browser window where Foundry is running.

## Troubleshooting

*   **"vite is not recognized..."**: Ensure you ran `npm install`.
*   **Symlink fails**: If `npm run link-create` fails, ensure you are not running Foundry when creating the link, or try simple running the command prompt / terminal as Administrator if you run into permission issues (though usually not required for user local data). You can also manually create a shortcut/symlink if your Foundry data is in a custom location.

## specialized Commands

*   `npm run link-remove`: Removes the symlink from your Foundry modules folder.
