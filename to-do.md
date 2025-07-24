# Issues and to-do items

## MT switch
State: not started
Pre-reqs: 
 - [x] get MT text into Elastic

 Have a toggle between whether the displayed document comes from the foreign-language or the machine-translation index.  Toggling the switch should cause a document reload from the appropriate index.

 Highlights are going to be weird if the assessor switches between versions.  The answer is to mark the document irrelevant for new highlights.

 ## Multiple highlights
 State: not started

 Allow the user to make multiple highlights in the document.  Clicking a highlight makes it unhighlighted.  Clicking irrelevant clears all highlights.

 Assess currently allows arbitrary text to he highlighted.  Bench2 tried a new approach by splitting the document into sentences, and allowing sentences to be clicked for highlighting.  Not sure I want to go there.
