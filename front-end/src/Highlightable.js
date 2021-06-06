import { React, useState, useEffect } from 'react';

import Interweave from 'interweave';
import ScanTermMatcher from './ScanTermMatcher';

function Highlightable(props) {
  const [highlight, set_highlight] = useState(null);

  // The 'doc' is populated from the 'orig' field of props.content
  let parsed = null;
  
  // If there is a corresponding highlight in props.rel,
  // highlight it in the given block of text.
  const highlight_rel_passage = (text) => {
    if (props.rel) {
      console.log(props.rel.start, props.rel.length);
      const start = props.rel.start;
      const end = start + props.rel.length;
      const prefix = text.slice(0, start);
      const span = text.slice(start, end);
      const suffix = text.slice(end);
      console.log(span);
      return prefix + ' <mark class="rel-highlight"> ' + span + ' </mark> ' + suffix;
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
  function search(blockno, highlight) {
    let hpos = 0; // position in highlight
    let tpos = 0; // position in text
    let mstart = -1;  // marked start pos in text
    const text = parsed.contents[blockno].content;
    console.log('highlight is "' + highlight + '", len ' + highlight.length);
    while (true) {
      console.log('h[' + hpos + '] = '+highlight.charAt(hpos)+', t['+tpos+'] = '+text.charAt(tpos));
      if (hpos >= highlight.length) {
        console.log('off end of highlight');
        return [mstart, tpos];
      } else if (tpos >= text.length) {
        console.log('off end of text');
        return [mstart, tpos];
      } else if (highlight.charAt(hpos) === text.charAt(tpos)) {
        console.log('match ' + highlight.charAt(hpos) + ' : ' + text.charAt(tpos));
        if (mstart < 0) {
          console.log('start!');
          mstart = tpos;
        }
        console.log('inc');
        hpos += 1;
        tpos += 1;
      } else if (isSpace(highlight[hpos])) {
        console.log('skipping nonmatching hl space');
        hpos += 1;
      } else if (isSpace(text[tpos])) {
        console.log('skippnig nonmatching text space');
        tpos += 1;
      } else {
        console.log('searching...');
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
  function get_selected_text(blockno) {
    let result = null;
    if (window.getSelection) {
      const sel = window.getSelection();
      
      if (!sel.isCollapsed) {
        const hl_text = sel.toString();
        const [start, end] = search(blockno, hl_text);
        if (start < 0 || (end - start) < hl_text.length) {
          console.log('bad search output ' + start + ' ' + end);
        } else {
          result = { "block": blockno,
                     "start": start,
                     "length": end - start,
                     "text": hl_text };
        }
        sel.removeAllRanges();
      }
    }

    return result;
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
  // from bench/front-end/src/WaPoDocument.js
  //
  const display_doc = () => {
    if (parsed === null)
      return '';
    
    if (!(parsed && parsed.hasOwnProperty('contents')))
      return '';
    let content = parsed.contents.filter(block => {
      return block != null;
    }).map((block, i) => {
      switch (block.type) {
      case 'kicker': return (<h3> {block.content} </h3>);
      case 'title': return (<h1> {block.content} </h1>);
      case 'byline': return (<h3> {block.content} </h3>);
      case 'date': return (<p> { new Date(block.content).toDateString() } </p>);
      case 'sanitized_html':
        let the_block = block.content;
        if (props.rel && props.rel.block == i)
          the_block = highlight_rel_passage(the_block);
        return (
          <div className="article-text"
               onMouseUp={() => {
                 if (has_selection()) {
                   set_highlight(get_selected_text(i));
                 }
               }}>
            <Interweave content={ the_block }
                        matchers={[new ScanTermMatcher('scanterms',
                                                       { scan_terms: props.scan_terms })]}/>
          </div>);
      case 'image': return (
        <figure className="figure">
          <img src={block.imageURL} className="figure-img img-fluid w-75"/>
          <figcaption className="figure-caption">{block.fullcaption}</figcaption>
        </figure>
      );
      case 'video': if (/youtube/.test(block.mediaURL)) {
        let id = block.mediaURL.match(/v=([^&]+)&/)[1];
        let url = "https://www.youtube.com/embed/" + id + "?feature=oembed";
        return (
          <iframe width="480" height="270" src={url} frameborder="0" allowfullscreen></iframe>
        );
      } else {
        return (
          <video controls src={block.mediaURL} poster={block.imageURL}>
            A video should appear here
          </video>
        );
      }
      case 'author_info': return (<p><i>{block.bio}</i></p>);
      default: return (<i> {block.type} not rendered</i>);
      };
    });
    let doc = ( <div>{content}</div> );
    return doc;
  };

  if (props.content && props.content.hasOwnProperty('orig')) {
    parsed = JSON.parse(props.content['orig']);
    return display_doc();
  } else {
    return <p>waiting...</p>;
  }
  
}

export { Highlightable as default };
