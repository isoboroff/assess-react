import { useState } from 'react';

// Render the task/request description
function Description(props) {
  const [show, setShow] = useState(false);

  if (props.desc) {
    const desc = props.desc.topics[0];
    return (
      <div className="border-bottom">
        <span className="h2 mr-5">Request: {props.desc['topic_id']}</span><br />
        <p><b>{desc['topic_title']}</b></p>
        <p><b>(High-level task:</b> {desc['topic_description']})</p>
        <p><b>Specific request: {desc['topic_narrative']}</b></p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{whiteSpace: 'pre-wrap'}}>{desc}</p>
}

export default Description;
