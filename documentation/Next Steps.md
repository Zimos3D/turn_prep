I've got all of the basics working. 

# Tweaks and fixes

## Sidebar
- Make Sidebar cards collapsible and collapsed by default. Opening shows features like it is now but still not the other fields like notes. When it's closed just the collapse arrow, plan name and context menu vertical ellipsis icon on the right - essentially the current top row of the card.

- Drag and drop reordering of the favorite cards (but not history cards, of course)

- Also add "arrange" options  to the Context menu. for the favorite cards (move up, down, top, bottom) like before


# Feature Tabl

- Search field to add features
    - Inserted into feature table headers
    - Filters based on the table it's attached to

- Change Default for new plans (Turn and Reaction) to put them at the top instead of the bottom so that they are the default recipient of sent features.

- Move to and Copy To context menu options
    - Currently the move to and copy to menu otions from the context menu on items in one of our feature tables provide a long list of every spot within every plan that they could be moved or copied to. 
    
    - Instead I'd like to see a list of all of the turn and reaction plans with turn plans first and reaction plans after. Each of those whould then have an additional submenu to route to the feature row within the plan. These new submenus should only show destinations that are compatible with the source item/feature. Anything can go into the additional features sections of turn or reaction plans. Options to move or copy to an Action or Bonus Action table in a turn plan or a Reaction table in a Reaction plan should only be shown if the feature being moved has an activity with the matching activation time.


# Additional Sheets

## Default Sheet

I'd really like to support the default system sheet. This will be a big project and will likely lead to some refactoring of the existing codebase but it'll be worth it. 

I'll need to spend some more time looking at the default sheet and make a detailed plan for this. 

## NPC Sheets

I would love to be able to use this for my NPCs. It'll take some modification, but I think it will be doable.
1. Tidy5e NPC sheet
2. Default NPC Sheet
3. Tidy5e Classic NPC Sheet


## Tidy5e Classic

We'll see if I decide to bother with this

