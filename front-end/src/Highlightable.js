import { React, useState, useEffect } from 'react';

import { Markup, Interweave } from 'interweave';
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
      } else if (highlight.charAt(hpos) === text.charAt(tpos)) {
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
  
  function get_selected_text(blockno) {
    let result = null;
    if (window.getSelection) {
      const sel = window.getSelection();
      
      if (!sel.isCollapsed) {
        const hl_text = sel.toString();
        const [start, end] = search(hl_text);
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

  useEffect(() => {
    if (highlight) {
      props.note_passage(highlight);
      set_highlight(null);
    }
  }, [highlight]);

  // from bench/front-end/src/WaPoDocument.js
  //
  const display_doc = (content_string) => {
    let obj = null;
    try {
      obj = JSON.parse(content_string);
    } catch (error) {
      console.error(error);
      return '';
    }
    if (!(obj && obj.hasOwnProperty('contents')))
      return '';
    let content = obj.contents.filter(block => {
      return block != null;
    }).map((block, i) => {
      switch (block.type) {
      case 'kicker': return (<h3> {block.content} </h3>);
      case 'title': return (<h1> {block.content} </h1>);
      case 'byline': return (<h3> {block.content} </h3>);
      case 'date': return (<p> { new Date(block.content).toDateString() } </p>);
      case 'sanitized_html':
        return (
          <div className="article-text"
               onMouseUp={() => {
                 if (has_selection()) {
                   set_highlight(get_selected_text(i));
                 }
               }}>
            <Interweave content={ highlight_rel_passage(block.content) }
                        matchers={[new ScanTermMatcher('scanterms',
                                                       { scan_terms: props.scan_terms })]}/>
          </div>);
      case 'image': return (
        <figure class="figure">
          <img src={block.imageURL} class="figure-img img-fluid w-75"/>
          <figcaption class="figure-caption">{block.fullcaption}</figcaption>
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

  // Holding on to this just for reference.
  const display_doc_better = (content_string) => {
    return (
      <div>
        <h1 dir="rtl" className="text-right"> { props.content.title } </h1>
        { props.content.date && (<p> (best guess on publication date is '{props.content.date}') </p>)}
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
      </div>);
  };
  

  if (props.content) {
    // old BETTER document rendering with highlighting
    return display_doc(props.content);
  } else {
    return <p>waiting...</p>;
  }
  
}

export { Highlightable as default };
