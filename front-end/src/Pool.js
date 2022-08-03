import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';

/*
 * A pool item interface component.  Clicking a pool item causes it to
 * load into the document pane.
 */
function PoolItem(props) {
  // Set the relevance 'badge' according to the judgment
  let badge = '';
  if (props.judgment !== '-1') {
    badge = (<Badge variant={props.rel_levels[props.judgment].color}>
      {props.rel_levels[props.judgment].label}
    </Badge>);
  }

  return (
    <ListGroup.Item action
      active={props.current}
      onClick={() => props.fetch_doc(props.seq)}>
      {props.seq + 1}: {props.docid.slice(0, 23)} {badge}
    </ListGroup.Item>
  );
}

/*
 * The pool component.  This basically renders the pool itself into pool items.
 */
function Pool(props) {
  const entries = props.pool
    .flatMap((entry, i) => {
      if (props.filter === 'all' ||
        (props.filter === 'unjudged' && entry.judgment === '-1') ||
        props.filter === entry.judgment) {
        return <PoolItem
          user={props.user}
          topic={props.topic}
          docid={entry.docid}
          seq={i}
          rel_levels={props.rel_levels}
          judgment={entry.judgment}
          current={props.current === i}
          fetch_doc={props.fetch_doc} />;
      } else
        return [];
    });
  return (<ListGroup> {entries} </ListGroup>);
}

export default Pool;
