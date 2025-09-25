import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";

// Render the task/request description
function Description(props) {
  if (props.desc) {
    const desc_obj = JSON.parse(props.desc);
    return (
      <>
        <ReactMarkdown>{desc_obj.query}</ReactMarkdown>
        <hr />
      </>
    );
  } else {
    return null;
  }
  // <p style={{whiteSpace: 'pre-wrap'}}>{desc}</p>
}

Description.propTypes = {
  desc: PropTypes.number,
};

export default Description;
