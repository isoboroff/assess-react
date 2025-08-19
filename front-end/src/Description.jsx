import PropTypes from "prop-types";

// Render the task/request description
function Description(props) {
  if (props.desc) {
    return (
      <div className="border-bottom">
        <span className="h2 mr-5">Request: {props.desc["id"]}</span>
        <br />
        <p>
          <b>{props.desc["narrative"]}</b>
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
