import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Panel from "./Panel";

function FullConvoModal(props) {
  const turns = props.desc.turns
    .filter((turn) => {
      return turn.turn_id <= props.turn;
    })
    .map((turn) => {
      const bold = turn.turn_id === props.turn;
      let text_class;
      if (bold) {
        text_class = "fw-bold";
      } else {
        text_class = "fw-light";
      }

      return (
        <div className="border-bottom">
          <div className={text_class}>
            <p>
              {turn.turn_id}: &nbsp;
              {turn.utterance}
              <br />({turn.resolved_utterance})
            </p>
            {props.turn != turn.turn_id && (
              <p>Sample response: {turn.response}</p>
            )}
          </div>
        </div>
      );
    });

  const ptkb = Object.getOwnPropertyNames(props.desc.ptkb)
    .map((idx) => [parseInt(idx), props.desc.ptkb[idx]])
    .sort(([k1, v1], [k2, v2]) => {
      if (k1 > k2) return 1;
      if (k1 < k2) return -1;
      return 0;
    })
    .map(([k, v]) => (
      <li>
        {k}: {v}
      </li>
    ));

  return (
    <Modal
      show={props.show}
      onHide={() => props.set_show(false)}
      size="lg"
      fullscreen={true}
    >
      <Modal.Header>
        <Modal.Title> Full conversation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <Col md={6}>
              <Panel>{turns}</Panel>
            </Col>
            <Col md={6}>
              <Panel>
                <ul className="list-unstyled">{ptkb}</ul>
              </Panel>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => props.set_show(false)}>
          Dismiss
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// Render the task/request description
function Description(props) {
  const [show, set_show] = useState(false);

  if (props.desc) {
    const turn_id = parseInt(props.topic.split("_")[1]);
    let utterance = null;
    let resolved;
    for (const t of props.desc.turns) {
      if (t.turn_id === turn_id) {
        utterance = t.utterance;
        resolved = t.resolved_utterance;
      }
    }
    return (
      <>
        <FullConvoModal
          show={show}
          set_show={set_show}
          desc={props.desc}
          turn={turn_id}
        />
        <div className="border-bottom">
          <span className="mr-5">
            Conversation {props.desc.number}, turn {turn_id}
          </span>
          <button variant="secondary" onClick={() => set_show(true)}>
            see conversation so far
          </button>
          <br />
          <p>
            <h2>{props.desc.title}</h2>
          </p>
          {utterance != null ? (
            <>
              <p>
                <b>{utterance}</b>
              </p>
              <p>({resolved})</p>
            </>
          ) : (
            <p>Can't find turn {turn_id}</p>
          )}
        </div>
      </>
    );
  } else {
    return null;
  }
  // <p style={{whiteSpace: 'pre-wrap'}}>{desc}</p>
}

export default Description;
