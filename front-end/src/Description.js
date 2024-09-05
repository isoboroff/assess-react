import { useState } from 'react';

// Render the task/request description
function Description(props) {

  function Hideaway(props) {
    const [show, setShow] = useState(false);

    function handleClick() {
      setShow(!show);
    }

    return (
      <div>
        <span className="h3 mr-5">{props.title}</span>
        <button onClick={handleClick}>{show ? 'hide' : 'show'}</button>
        <p style={{ display: show ? '' : 'none' }}>
          {props.children}
        </p>
      </div>
    );
  }

  if (props.desc) {
    return (
      <div className="border-bottom">
        <p><b>{props.desc['page_info']['page_id']} --
        {props.desc['page_info']['page_title']}></b></p>
        <p id='page_desc' style={{ whiteSpace: 'pre-wrap' }}>{props.desc['page_info']['description']}</p>
        <span className="h3 mr-5">
          {props.desc['section_info']['title']}
        </span>
        <p style={{ whiteSpace: 'pre-wrap' }}>{props.desc['section_info']['text']}</p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{ whiteSpace: 'pre-wrap' }}>{desc}</p>
}

export default Description;
