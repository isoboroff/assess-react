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
        <p><b>{props.desc['text_id']}</b></p>
        <Hideaway title={props.desc['page_title']}>
          <p id='page_desc' style={{ whiteSpace: 'pre-wrap' }}>{props.desc['context_page_description']}</p>
        </Hideaway>
        <span className="h3 mr-5">{props.desc['section_title']}</span>
        <p style={{ whiteSpace: 'pre-wrap' }}>{props.desc['context_section_description']}</p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{ whiteSpace: 'pre-wrap' }}>{desc}</p>
}

export default Description;
