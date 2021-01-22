import { React, useEffect } from 'react';
import Mark from 'mark.js';

function BetterDocument(props) {
  const display_doc = (content_string) => {
    let obj = null;
    /*
    try {
      obj = JSON.parse(content_string);
    } catch (error) {
      console.error(error);
      return '';
    }
    */
    obj = content_string;

    let doctext = obj['text'];
    
    if (props.rel) {
      const start = props.rel.start;
      const end = start + props.rel.length;
      const prefix = doctext.slice(0, start);
      const span = doctext.slice(start, end);
      const suffix = doctext.slice(end);
      doctext = <> {prefix} <mark> {span} </mark> {suffix} </>;
    }
    
    return (
      <div>
        <h1> {obj['title']} </h1>
        <p> (best guess on publication date is '{obj['date']}')</p>
        <p><strong> {obj['url']} </strong></p>
        <p className="article-text"> {doctext} </p>
      </div>
    );
  };

  useEffect(() => {
    const marker = new Mark(document.querySelector('.reviewdoc'));
    marker.unmark({done: () => {
      marker.mark(props.scan_terms, {
        diacritics: true,
        acrossElements: true,
        accuracy: 'complementary',
        limiters: '.,:;-?!'.split('')
      });
    }});
  });

  if (props.loading) {
    return ( <p>loading...</p> );
  } else if (props.error) {
    return ( <p>Error</p> );
  } else if (props.content) {	
    return (
	  <div className="reviewdoc">{display_doc(props.content)}</div>
    );
  } else {
    return (<p>waiting for document...</p>);
  }

}

export { BetterDocument as default };
