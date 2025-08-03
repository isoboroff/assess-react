# to do

1. work on issues (see below)
2. create pools (needs adaptation of the RAGTIME script, or a new one)
3. set up user.py for assessors and add those folks to bench2



# Issues

## Clippy is off the bottom of the window.
**Done**

- need to make sure it all stays in the view.

## Summary not being restored

- if I switch topics, and then switch back, the summary is not populated in the interface.  It's in the log, so it's not lost.

## topicdesc
**Done**
 - there are differences in the JSON topics, check if those make issues:
   - ptkb was a dict of {number: item} and is now a list of items
   - turns -> responses
   - turns.X.utterance -> user_utterance
   - turns.X.ptkb_provenance -> relevant_ptkbs
   - turns.X.response_provenance -> citations
