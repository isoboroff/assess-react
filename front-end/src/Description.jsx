import PropTypes from "prop-types";

// Render the task/request description
function Description(props) {
  if (props.desc) {
    const subnarratives = props.desc['sub_narratives'].map((n) => <li>{n['text']} ({n['importance']})</li>)
    return (
      <div className="border-bottom">
        <span className="h2 mr-5">Request: {props.desc["id"]}</span>
        <br />
        <p>
          {props.desc["narrative"]}
        </p>
        <ul>
          {subnarratives}
        </ul>
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
