function BetterDocument(props) {

  const title = (title_text) =>  <h1> {title_text} </h1> ;
  const date = (date_text) => <p> (best guess on publication date is '{date_text}' </p>;
  const url = (url_text) => <p> <strong> {url_text} </strong> </p>;
  const text = (string) => <p className="article-text"> {string} </p>;

  const add_rel_passage = (doc) => {
    if (props.rel) {
      const start = props.rel.start;
      const end = start + props.rel.length;
      const prefix = doc.text.slice(0, start);
      const span = doc.text.slice(start, end);
      const suffix = doc.text.slice(end);
      return <div> {prefix} <mark className="rel-highlight"> {span} </mark> {suffix} </div>;
    } else {
      return doc.text;
    }
  };    
  
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
    
    
    return (
      <div>
        { title(obj.title) }
        { date(obj.date) }
        { url(obj.url) }
        { text(add_rel_passage(obj.text)) }
      </div>
    );
  };
}

export { BetterDocument as default };
