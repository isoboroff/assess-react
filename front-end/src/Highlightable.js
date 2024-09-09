import { React, useState, useEffect } from 'react';

import Interweave from 'interweave';
import ScanTermMatcher from './ScanTermMatcher';

function Highlightable(props) {
  const [highlight, set_highlight] = useState(null);

  // If there is a corresponding highlight in props.rel,
  // highlight it in the given block of text.
  const highlight_rel_passages = (text) => {
    if (props.rel && props.rel.passage) {
      let highlights = props.rel.passage;
      if (!Array.isArray(highlights)) {
        highlights = [highlights];
      }
      highlights = highlights.toSorted((a,b) => a.start - b.start);
      let pos = 0;
      let doc = "";

      for (const hl of highlights) {
        const start = hl.start;
        if (start < pos) continue;
        const end = start + hl.length;
        const prefix = text.slice(pos, start);
        const span = text.slice(start, end);
        doc += prefix + ' <mark class="rel-highlight" id="'
          + start + '"> ' + span + ' </mark> ';
        pos = end;
      }
      doc += text.slice(pos);
      return doc;

    } else {
      return text;
    }
  };

  // This is for right-to-left text in the document.  We shouldn't generally
  // need it unless we're assessing a RTL language like Arabic.
  const set_rtl = (string) => {
    return '<div dir="rtl" class="text-right">' + string + '</div>';
  };

  // Adapted from https://github.com/wooorm/is-whitespace-character (MIT license)
  // It turns out JavaScript doesn't have a proper UTF-8 compliant isSpace() #wtf
  function isSpace(char) {
    return char && /\s/.test(
      typeof char === 'number'
        ? String.fromCharCode(char)
        : char.charAt(0)
    );
  }

  // Search for a text string in the props.content document
  // This is for highlighted passages.  I expect it to match and
  // am happy to take the first match found.
  // We need this because JavaScript will give us back what was highlighted,
  // but not the starting and ending coordinates in the original (possibly already
  // highlighted) text block.
  //
  // Returns [start, end]
  function search(highlight) {
    let hpos = 0; // position in highlight
    let tpos = 0; // position in text
    let mstart = -1;  // marked start pos in text
    const text = props.content.text;
    //console.log('highlight is "' + highlight + '", len ' + highlight.length);
    while (true) {
      //console.log('h[' + hpos + '] = '+highlight.charAt(hpos)+', t['+tpos+'] = '+text.charAt(tpos));
      if (hpos >= highlight.length) {
        //console.log('off end of highlight');
        return [mstart, tpos];
      } else if (tpos >= text.length) {
        //console.log('off end of text');
        return [mstart, tpos];
      } else if (highlight.charAt(hpos) === text.charAt(tpos)) {
        //console.log('match ' + highlight.charAt(hpos) + ' : ' + text.charAt(tpos));
        if (mstart < 0) {
          //console.log('start!');
          mstart = tpos;
        }
        //console.log('inc');
        hpos += 1;
        tpos += 1;
      } else if (isSpace(highlight[hpos])) {
        //console.log('skipping nonmatching hl space');
        hpos += 1;
      } else if (isSpace(text[tpos])) {
        //console.log('skippnig nonmatching text space');
        tpos += 1;
      } else {
        //console.log('searching...');
        mstart = -1;
        hpos = 0;
        tpos += 1;
      }
    }
  }

  // Is something selected?
  function has_selection() {
    return (window.getSelection && !window.getSelection().isCollapsed);
  }

  // Return the selection, with (block, start, len)
  function get_selected_text() {
    let result = null;
    if (window.getSelection) {
      const sel = window.getSelection();

      if (!sel.isCollapsed) {
        const hl_text = sel.toString();
        const [start, end] = search(hl_text);
        if (start < 0 || (end - start) < hl_text.length) {
          console.log('bad search output ' + start + ' ' + end);
        } else {
          result = {
            "start": start,
            "length": end - start,
            "text": hl_text
          };
        }
        sel.removeAllRanges();
      }
    }

    return result;
  }

  // Clear a highlight if we clicked it.
  function maybe_remove_highlight(sel) {
    const hl_id = sel.anchorNode.parentElement.getAttribute('id');
    if (hl_id == null)
      return;
    props.del_passage(hl_id);
  }

  // This effect fires if highlight changes.
  // It calls props.note_passage which notes the relevance judgment.
  useEffect(() => {
    if (highlight) {
      props.note_passage(highlight);
      set_highlight(null);
    }
  }, [highlight]);

  // Document rendering
  // but with added bits to support highlighting
  //
  const display_doc = () => {
    const title = props.content['title'];
    let text = props.content['text'];
    if (props.rel)
      text = highlight_rel_passages(text);
    let textdir = '';
    let textclass = 'article-text';
    if (props.content['lang'] === 'fas') {
      textdir = 'rtl';
      textclass = 'text-right article-text';
    }

    return (
      <div>
        <div dir={textdir} className={textclass}
          onMouseUp={(e) => {
            if (!e.altKey && has_selection()) {
              set_highlight(get_selected_text());
            } else if (window.getSelection) {
              const sel = window.getSelection();
              if (sel.isCollapsed &&
                  (sel.anchorNode == sel.focusNode) &&
                  sel.anchorNode.parentNode.tagName == 'MARK') {
                maybe_remove_highlight(sel);
              }
            }
          }}>
          <Interweave content={text}
            matchers={[new ScanTermMatcher('scanterms',
              { scan_terms: props.scan_terms })]} />
        </div>
      </div>
    );
  };

  if (props.content) {
    return display_doc();
  } else {
    return <p>No document selected, or document is missing</p>;
  }

}

export { Highlightable as default };
