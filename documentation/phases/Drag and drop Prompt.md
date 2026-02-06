The next thing I want to tackle is, I'm guessing, a fairly big job that will require a lot of changes to accommodate. 

I want to get into the ability to reorganize features and plans within the turn prep panels both via drag and drop functionality and context menu operations

This includes all of the following:

- Drag and drop features from our feature/item tables onto other feature tables wihtin the same plan and between plans.

- Checking the activation costs/types upon dropping to gracefully handle features thatt don't match the table they are being dropped onto.

- Regular Drag and Drop to move a feature, Shift + Drag and Drop to Copy the feature to the new location.

- Drag and drop to reorder the instances in All three sections (Dm Question, Turn Plans, Reactions).

- "Move >" Context menu options to move an instnace on a DM Question, Turn Plan or Reaction Plan. Extends to a secondary context menu with options to Move up, down, to top, and to bottom.

- For items in our feature tables: "Move to >" and "Copy to >" Menu Options on items in the feature tables that open a Secondary Menu attached to the main context menu should have two sections "Turns" and "Reactions". 

  - Under Turns it should list all turn plans. Indented below each turn plan would be listed "Action", "Bonus Action", and/or "Additional Features" though it should only show those indented items for which the feature in question has a qualifying activity.   i.e. if this is the context menu for an item that has a Activity with activation Cost of an Action, The plans listed in the context menu would all show "Action" and "Additional Features options" (Reminder that any feature/item can go into "Additional Features"). 

  - Under Reactions, It would list all Reaction Plans with "Reactions" and "Additional Feature" options nested under each. These would be similarly filtered out based on the activation type(s) of the Acticities assocated with the item/feature in question. 

  - The menu options for "Move to  >" and "Copy to  >" are identical. The only difference is the behavior of whether the feature is moved or copied. 

A feature/item that is dragged from a feature table and dropped somewhere should behave as follows:
  
  - If it has an activity with an activation cost that matches the type associated with the feature table it is dropped on, add it to that table. I

  - If  it doesn't have the right activation type, add it to the "additional features" table of that plan (turn plan or reaction plan)

  - If it is Shift + Dropped, copy it without removing it from its original table. If it is regualr dropped, add it where it is dropped and remove it from its table of origin.

  - If it is dropped on a plan panel (turn plan or reaction plan, check the activation type of its activities and add it to the relevant action, Bonus Action, or Reaction table where appropriate. If it doesn't match one fo the tables activation types within that panel, add it to additional features. Prioritize adding to action over bonus action if a feature/item has both activation costs associated with different activities


This is a big task, I can tell. Please generate a plan for it before we dive into implementation. Ask me clarifying questions as neeeded in the docunment and leave places for my answers. Note the reference files I've specified and leave notes about how and when to reference them while implementing. If you would find it helpful, add notes about the structure of those files and how they will each need to be modified in this implementation. Try to identify edge cases that I haven't considered and include those in the questions for me to address. 

It does seem like Foundry has a built in behavior for dragging and dropping features/items. FOr example when a feature is dropped into a rich text editing panel, it pastes in some sort of @code that links to the feature and allows for things like hovering to see the full feature. Please research that and see if thast can be tied into and used here. It would eb great if these panels and tables accepted generic FOundry dropping of features, as opposed to some specialized drag and drop that is unique to our sheet. I wonder about how to pick up the feature for lack of a better term at the start of the drag tying into this foudnry behavior as well.  As you're researching make sure you are looking at info that pertains to the currnt version - V13. 

Thank you. Plesae prep this document. We'll iron out anything that is unclear and then we will start implementing this.