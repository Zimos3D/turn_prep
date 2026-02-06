# Resources
An existing module for compatibility and for style and functionality reference:
https://github.com/kgar/foundry-vtt-tidy-5e-sheets

A guide to developing modules for foundry vtt:
https://foundryvtt.com/article/module-development/

Foundry Vtt API Docs
https://foundryvtt.com/api/

D&D 5E System for FOundry VTT Repo:
https://github.com/foundryvtt/dnd5e

# Overview
I use Foundry VTT to run my D&D campaign. I'd like your help developing an add-on that is compatible with the "Tidy 5e Sheets" module (github link above) that would add an additional tab to the character sheets where players could prep their next turn so that they are ready to go when their turn comes around. Integrates naturally with Foundry's right click context menu. 

# Versions
Foundry Version 13+
D&D System for Foundry v. 5.2.X+

# UI
A collection of panels within a character sheet tab.
Panels outlined below

## DM questions

- A space to note clarifying questions that the players want to ask the DM at the start of the term. 
- a single Text box to write a question. 
- a + button to the left add another question below the existing one
  - subsequent questions also have a - button to delete (all but the first)
- "Send to Chat" and "Whisper to DM" buttons to the right of each box

## Turn Plans
- Ability to add multiple plans with plus and minus buttons like above with the DM questions

- Each Turn plan would be a box with labels and text boxes for:
  - Action
  - Bonus Action
  - Movement
  - Trigger or reason to use this plan
  - Roleplay / narration to add to the turn
  - Additional Features (accepts multiple features of any kind, such as optional features that trigger on weapon hits)

- For Action and Bonus Actions - the ability to start typing and see a clickable list of relevant features (filtered by action type) that the character has to choose from. Clicking a feature adds it to the field.

- For Additional Features - the ability to select from any features, spells, or items the character has and add multiple selections.

- The ability to click a roll button next to actions/bonus actions/features to trigger Foundry's native roll dialog (showing normal/advantage/disadvantage options), hooking into the same roll functionality as the native character sheet tabs.

- A clear all button at the top of this section and individual clear buttons.

- Favorite turns can be moved to the History & Favorites sidebar tab (Tidy 5E) or side panel (Default Sheet)


## Reactions

- Reactions aren't part of the actual turn so they need their own space.

- As above THe ability to add as many of these as the player sees fit. 

- Text boxes for what aaction in the scene would trigger the player to want to or be able to use this

- Clear and sent to history buttons.

## History & Favorites (Tidy 5E Only)

Integrated as a dedicated sidebar tab in Tidy 5E's Character Sheet sidebar (alongside Favorites, Skills, and Traits tabs).

- Basic text summaries of turn plans displayed in a list
- Togglable between two views with the same layout:
  - **Favorites**: A saved collection of commonly used turns (reorderable)
  - **History**: A running log of past turns (limited to 10, configurable via module settings)
- A "Load" button on each entry to load it into the current turn plans section
- When a turn is completed, it automatically gets added to the History

### History & Favorites (Default D&D 5e Sheet)

For the default sheet, History and Favorites will appear as a collapsible side panel within the Turn Prep tab itself, providing similar functionality but integrated directly into the tab rather than in a sidebar.


# Context Menu Options
- The ability to right click on items, spells, and features across all character sheet tabs and click "Prepare for Next Turn" to add it in the appropriate place on the turn prep tab.

- For actions and bonus actions, the feature will be added to the corresponding field if empty, otherwise a new turn plan will be created.

- For non-action/bonus-action items and features, they will be added to the Additional Features field of the current plan.

- The Tidy 5e Sheets module has a sheet tab that can be customized to show only the most accessed features and actions. Right clicking on items on other tabs gives "add to sheet tab" or "remove from sheet tab" options. I'd like adding things to the turn tab to work in a similar way.

# Sheet Integration

## Tidy 5E Sheets Integration
- **Main Tab**: A new "Turn Prep" tab on the character sheet containing:
  - DM Questions section
  - Turn Plans section
  - Reaction Plans section
- **Sidebar Tab**: A new "Turns" sidebar tab integrated into Tidy 5E's character sheet sidebar(with hourglass icon, or clock icon if hourglass unavailable) containing:
  - Favorite Turns (reorderable)
  - Turn History (most recent 10 turns, configurable limit)
- Does not modify any existing Tidy 5E tabs or functionality
- Integrates via the Tidy 5E Sheets API using `registerCharacterSidebarTab()`

## Default D&D 5e Sheet Integration
- **Main Tab**: A new "Turn Prep" tab on the character sheet containing:
  - DM Questions section
  - Turn Plans section
  - Reaction Plans section
  - Collapsible side panel containing History & Favorites (matching Tidy 5E functionality but integrated within the tab)

## General
- Context menu options appear on all items, spells, and features across the entire sheet (regardless of sheet type)
- This module will inherit the standard character sheet permissions—DM access is determined by whatever permission model the character sheet uses. 

# Conclusion
Ideally I'd like this to also work with the default Foundry D&D 5e character sheet, but I'm okay with expanding into that later. 

The links provide info on module development and on the tidy 5e sheets module specifically. Let me know if there is additional information you need to move forward with developing this module. Let me know if there is anything unclear in my specifications. Let me know if there are additional resources you can provide. For now hold off on actually generating the code and just give me a sense of whether you feel like you have the information you need for this project.

---

# Technical Specifications

## Data Persistence
- All turn prep data (DM questions, turn plans, reactions) shall persist between sessions and be stored on the character sheet actor data.
- History and Favorites data shall also persist permanently.

## Feature Selection
- Feature/spell/item selection lists should pull directly from the character's actual Foundry data (items, spells, features, etc.).
- Lists should be filtered based on context (e.g., only showing abilities with "Action" or "Bonus Action" type for those specific fields).
- Selection should be via clickable list UI rather than text autocomplete.

## Module Settings
- **History Limit** (default: 10): Configurable maximum number of turn history entries to retain per character