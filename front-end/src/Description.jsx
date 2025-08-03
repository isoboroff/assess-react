import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";

import Panel from "./Panel";

function FullConvoModal(props) {
  const turns = props.desc.responses
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
              {turn.user_utterance}
              <br />({turn.resolved_utterance})
            </p>
            {props.turn != turn.turn_id && (
              <p>Sample response: {turn.response}</p>
            )}
          </div>
        </div>
      );
    });

  const ptkb = props.desc.ptkb
    .map((e, idx) => (
      <li>
        {idx}: {e}
      </li>
    ));

  return (
    <Modal
      show={props.show}
      onHide={() => props.set_show(false)}
      scrollable="true"
      size="lg"
    >
      <Modal.Header>
        <Modal.Title>Conversation so far...</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container fluid>
          <Row>
            <Col
              style={{
                height: "calc(100vh - 300px)",
                overflowY: "scroll",
                borderRight: "1px solid #ccc",
              }}
            >
              <h2>Turns</h2>
              {turns}
            </Col>
            <Col
              md={4}
              style={{
                height: "calc(100vh - 300px)",
                overflowY: "scroll",
              }}
            >
              <h2>PTKB</h2>
              <ul className="list-unstyled">{ptkb}</ul>
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
    for (const t of props.desc.responses) {
      if (t.turn_id === turn_id) {
        utterance = t.user_utterance;
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
      </span>&nbsp;
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
