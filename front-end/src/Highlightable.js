import { React, useState, useEffect } from 'react';

import Interweave from 'interweave';
import ScanTermMatcher from './ScanTermMatcher';

function Highlightable(props) {
  const [highlight, set_highlight] = useState(null);

  const highlight_rel_passage = (text) => {
    if (props.rel) {
      const start = props.rel.start;
      const end = start + props.rel.length;
      const prefix = text.slice(0, start);
      const span = text.slice(start, end);
      const suffix = text.slice(end);
      return prefix + ' <mark className="rel-highlight"> ' + span + ' </mark> ' + suffix;
    } else {
      console.log('no rel');
      return text;
    }
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
  // Returns [start, end]
  function search(highlight) {
    let hpos = 0; // position in highlight
    let tpos = 0; // position in text
    let mstart = -1;  // marked start pos in text
    const text = props.content['text'];
    // console.log('highlight is "' + highlight + '", len ' + highlight.length);
    while (true) {
      // console.log('h[' + hpos + '] = '+highlight.charAt(hpos)+', t['+tpos+'] = '+text.charAt(tpos));
      if (hpos >= highlight.length) {
        // console.log('off end of highlight');
        return [mstart, tpos];
      } else if (tpos >= text.length) {
        // console.log('off end of text');
        return [mstart, tpos];
      } else if (highlight.charAt(hpos) == text.charAt(tpos)) {
        // console.log('match ' + highlight.charAt(hpos) + ' : ' + text.charAt(tpos));
        if (mstart < 0) {
          // console.log('start!');
          mstart = tpos;
        }
        // console.log('inc');
        hpos += 1;
        tpos += 1;
      } else if (isSpace(highlight[hpos])) {
        // console.log('skipping nonmatching hl space');
        hpos += 1;
      } else if (isSpace(text[tpos])) {
        // console.log('skippnig nonmatching text space');
        tpos += 1;
      } else {
        // console.log('searching...');
        mstart = -1;
        hpos = 0;
        tpos += 1;
      }
    }
  }

  function has_selection() {
    return (window.getSelection && !window.getSelection().isCollapsed);
  }
  
  function get_selected_text() {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (!sel.isCollapsed) {
        const hl_text = sel.toString();
        const [start, end] = search(hl_text);
        if (start < 0 || (end - start) < hl_text.length) {
          console.log('bad search output ' + start + ' ' + end);
          return null;
        } else {
          return { "start": start,
                   "length": end - start,
                   "text": hl_text };
        }
      }
    }
    return null;
  }

  useEffect(() => {
    if (highlight) {
      props.note_passage(highlight);
      set_highlight(null);
    }
  }, [highlight]);

  if (props.rel) {
    console.log(props.rel);
  }
  
  if (props.content) {
    return (
      <div>
        <h1> { props.content.title } </h1>
        <p> (best guess on publication date is '{props.content.date}') </p>
        <p> <strong> { props.content.url } </strong> </p>
        <div className="article-text"
             onMouseUp={() => {
               if (has_selection()) {
                 set_highlight(get_selected_text());        
               }
             }}>
          <Interweave content={ highlight_rel_passage(props.content.text) }
                                matchers={[new ScanTermMatcher('scanterms', { scan_terms: props.scan_terms })]}/>
        </div>
      </div>
    );
  } else {
    return <p>waiting...</p>;
  }
  
}

export { Highlightable as default };
//matchers={[new ScanTermMatcher('scanterms', { scan_terms: props.scan_terms })]}
