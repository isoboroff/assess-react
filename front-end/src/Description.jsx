import PropTypes from "prop-types";

// Render the task/request description
function Description(props) {
  if (props.desc) {
    return (
      <div className="border-bottom">
        <span className="h2 mr-5">Request: {props.desc["topic_id"]}</span>
        <br />
        <div className="question-text">{props.desc["question"]}</div>
      </div>
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
