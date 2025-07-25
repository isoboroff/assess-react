import { useState } from "react";

// Render the task/request description
function Description(props) {
  const [show, setShow] = useState(false);

  if (props.desc) {
    return (
      <div className="border-bottom">
        <span className="h2 mr-5">Request: {props.desc["request_id"]}</span>
        <br />
        <p>
          <b>{props.desc["title"]}</b>
        </p>
        <p>
          <b>Background:&nbsp;</b>
          {props.desc["background"]}
        </p>
        <p>
          <b>Problem statement:&nbsp;</b>
          {props.desc["problem_statement"]}
        </p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{whiteSpace: 'pre-wrap'}}>{desc}</p>
}

export default Description;
