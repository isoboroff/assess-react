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
    const desc = JSON.parse(props.desc['orig']);
    return (
      <div className="border-bottom">
        <p><b>{desc['text_id']}</b></p>
        <Hideaway title={desc['page_title']}>
          <p id='page_desc' style={{ whiteSpace: 'pre-wrap' }}>{desc['context_page_description']}</p>
        </Hideaway>
        <span className="h3 mr-5">{desc['section_title']}</span>
        <p style={{ whiteSpace: 'pre-wrap' }}>{desc['context_section_description']}</p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{ whiteSpace: 'pre-wrap' }}>{desc}</p>
}

export default Description;
