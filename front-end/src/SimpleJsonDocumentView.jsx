import PropTypes from "prop-types";
import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite";
import 'react-json-view-lite/dist/index.css';

export default function SimpleJsonDocumentView({ document }) {
  const textclass = "product-text";
  const doc_obj = document && JSON.parse(document.orig);

  return (
    <div>
      <div className={textclass}>
        <h3>{document && document.title}</h3>
      </div>
      <JsonView data={doc_obj} shouldExpandNode={allExpanded} style={defaultStyles} />
      <p></p>
    </div>
  );
}

SimpleJsonDocumentView.propTypes = {
  document: PropTypes.object,
};
