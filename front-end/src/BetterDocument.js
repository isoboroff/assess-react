import React from 'react';

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

  if (props.loading) {
    return ( <p>loading...</p> );
  } else if (props.error) {
    return ( <p>Error</p> );
  } else if (props.content) {	
    return (
	  <>{display_doc(props.content)}</>
    );
  } else {
    return (<p>waiting for document...</p>);
  }
}

export { BetterDocument as default };
