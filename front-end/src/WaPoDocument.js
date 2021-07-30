import React from 'react';
import Markup from 'interweave';

function WaPoDocument(props) {
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
	  <Markup tagName="div"
		  className="text-wrap article-text"
		  content={block.content}/>);
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

  if (props.content) {	
    return (
      <>{display_doc(props.content)}</>
    );
  } else {
    return (<p>waiting for document...</p>);
  }
}

export { WaPoDocument as default };
