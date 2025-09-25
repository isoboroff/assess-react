import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";

export default function SimpleJsonDocumentView({ document }) {
  return <ReactMarkdown>{document?.text}</ReactMarkdown>;
}

SimpleJsonDocumentView.propTypes = {
  document: PropTypes.object,
};
