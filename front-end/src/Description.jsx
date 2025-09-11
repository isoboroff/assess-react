import PropTypes from "prop-types";

// Render the task/request description
function Description(props) {
  if (props.desc) {
    const desc = JSON.parse(props.desc);
    return (
      <div className="border-bottom">
        <span className="mr-5">Topic {desc.id}</span>
        <br />
        <p><span className="h2">
          {desc.query}
          </span>
        </p>
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
