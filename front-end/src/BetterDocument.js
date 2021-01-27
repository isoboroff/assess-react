import { React, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Mark from 'mark.js';

function BetterDocument(props) {
  const [highlight, set_highlight] = useState(null);
  
  // Adapted from https://github.com/wooorm/is-whitespace-character (MIT license)
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
      if (hpos >= highlight.length) {
        // console.log('off end of highlight');
        return [mstart, tpos];
      } else if (tpos >= text.length) {
        // console.log('off end of text');
        return [mstart, tpos];
      } else if (highlight[hpos] == text[tpos]) {
        // console.log('match ' + highlight[hpos] + ' : ' + text[tpos]);
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
        const highlight = sel.toString();
        const [start, end] = search(highlight);
        if (start < 0 || (end - start) < highlight.length) {
          console.log('bad search output ' + start + ' ' + end);
          return null;
        } else {
          return { "start": start,
                   "length": end - start,
                   "text": highlight };
        }
      }
    }
    return null;
  }

  const display_doc = (content) => {
    let obj = null;
    /*
    try {
      obj = JSON.parse(content_string);
    } catch (error) {
      console.error(error);
      return '';
    }
    */
    obj = content;

    let doctext = obj['text'];

    if (props.rel) {
      const start = props.rel.start;
      const end = start + props.rel.length;
      const prefix = doctext.slice(0, start);
      const span = doctext.slice(start, end);
      const suffix = doctext.slice(end);
      doctext = <div> {prefix} <mark className="rel-highlight"> {span} </mark> {suffix} </div>;
    }

    return (
      <div>
        <h1> {obj['title']} </h1>
        <p> (best guess on publication date is '{obj['date']}')</p>
        <p><strong> {obj['url']} </strong></p>
        <div className="article-text"
             onMouseUp={(e) => {
               if (props.note_passage && has_selection()) {
                 const h = get_selected_text();
                 if (h)
                   set_highlight(h);
               }
             }}>
          {doctext}
        </div>
      </div>
    );
  };

  /*
  useEffect(() => {
    if (props.scan_terms) {
      const marker = new Mark(document.querySelector('.article-text'));
      marker.unmark({done: () => {
        marker.mark(props.scan_terms, {
          diacritics: true,
          acrossElements: true,
          element: 'span',
          className: 'scan-term',
          accuracy: 'complementary',
          limiters: '.,:;-?!'.split('')
        });
      }});
    }
  }, [props.content, props.scan_terms]);
  */

  useEffect(() => {
    if (highlight && props.note_passage) {
      props.note_passage(highlight);
      set_highlight(null);
    }
  }, [highlight]);
  
  return (
    <>
      { props.loading && (<p>loading...</p>) }
      { props.error && (<p>error loading!</p>) }
      <div className="reviewdoc"
           onMouseUp={(e) => {
             if (props.note_passage && has_selection()) {
               const h = get_selected_text();
               if (h)
                 set_highlight(h);
             }
           }}
      >
        { props.content && display_doc(props.content) }
      </div>
    </>
  );

}

export { BetterDocument as default };
