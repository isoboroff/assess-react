import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import Badge from "react-bootstrap/Badge";
import { flatmap } from "./utils";
export default function MarkdownDocumentView({
  document,
  docid,
  rel_levels,
  judgment,
}) {
  const colors = flatmap(rel_levels, "color");
  const labels = flatmap(rel_levels, "label");
  // Set the relevance 'badge' according to the judgment
  let badge = "";
  if (judgment !== "-1") {
    let classdecl = `bg-${colors[judgment]}`;
    badge = <Badge className={classdecl}>{labels[judgment]}</Badge>;
  }

  const md_text =
    document && document.text
      ? document.text.replace("{pid}", docid)
      : "no document";

  return (
    <>
      {badge}
      <ReactMarkdown>{md_text}</ReactMarkdown>
    </>
  );
}

MarkdownDocumentView.propTypes = {
  document: PropTypes.object,
  docid: PropTypes.string,
  rel_levels: PropTypes.object,
  judgment: PropTypes.string,
};
