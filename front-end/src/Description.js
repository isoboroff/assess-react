import { useState } from 'react';

// Render the task/request description
function Description(props) {
  const [show, setShow] = useState(false);

  if (props.desc) {
    console.log(props.desc);
    return (
        <div className="border-bottom">
        <span className="h2 mr-5">Convo : {props.desc.number}</span><br />
        <p><b>{props.desc.title}</b></p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{whiteSpace: 'pre-wrap'}}>{desc}</p>
}

export default Description;
