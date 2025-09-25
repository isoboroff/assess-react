import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { flatmap } from "./utils";
/*
 * A pool item interface component.  Clicking a pool item causes it to
 * load into the document pane.
 */
function PoolItem(props) {
  const colors = flatmap(props.rel_levels, "color");
  const labels = flatmap(props.rel_levels, "label");
  // Set the relevance 'badge' according to the judgment
  let badge = "";
  if (props.judgment !== "-1") {
    let classdecl = `bg-${colors[props.judgment]}`;
    badge = <Badge className={classdecl}>{labels[props.judgment]}</Badge>;
  }

  const show_docid = props.docid;

  return (
    <ListGroup.Item
      action
      active={props.current}
      onClick={() => props.fetch_doc(props.seq)}
    >
      {props.seq + 1}: {show_docid} {badge}
    </ListGroup.Item>
  );
}

/*
 * The pool component.  This basically renders the pool itself into pool items.
 */
function Pool(props) {
  const entries = props.pool.flatMap((entry, i) => {
    if (
      props.filter === "all" ||
      (props.filter === "unjudged" && entry.judgment === "-1") ||
      props.filter === entry.judgment
    ) {
      return (
        <PoolItem
          user={props.user}
          topic={props.topic}
          docid={entry.docid}
          seq={i}
          rel_levels={props.rel_levels}
          judgment={entry.judgment}
          current={props.current === i}
          fetch_doc={props.fetch_doc}
        />
      );
    } else return [];
  });
  return (
    <Row>
      <Col className="vh-full overflow-auto">
        <ListGroup> {entries} </ListGroup>
      </Col>
    </Row>
  );
}

export default Pool;
