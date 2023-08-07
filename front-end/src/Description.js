import { useState } from 'react';

// Render the task/request description
function Description(props) {

  if (props.desc) {
    return (
      <div className="border-bottom">
        <p><b>{props.desc['id']}</b>: {props.desc['query']}</p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{ whiteSpace: 'pre-wrap' }}>{desc}</p>
}

export default Description;
