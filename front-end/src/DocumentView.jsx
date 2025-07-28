import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col"
import Popover from "react-bootstrap/Popover";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import segment from "./sentencex";


const DocSentence = ({  key, sentence, marked, note, vital, add_passage, del_passage, children  }) => {
  const [highlight, setHighlight] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(note);
  const [isVital, setIsVital] = useState(vital);
  
  const build_passage = () => {
    return { sentence: sentence, text: children, vital: isVital, note: noteText};
  };

  const popover = (
    <Popover 
      id="note" 
      onMouseEnter={() => setShowNote(true)} 
      onMouseLeave={() => setShowNote(false)} 
      style={{ width: '500px' }}
      >
      <Popover.Header as="h3">Enter note</Popover.Header>
      <Popover.Body>
        <Form.Group as={Row} className="align-items-center">
          <Col>
         <Form.Control type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}/>
         </Col>
         <Col className="col-auto">
         <Form.Check label="Vital?" checked={isVital} onClick={() => setIsVital(!isVital)}/>
         </Col>
         <Col className="col-auto">
         <Button onClick={() => { add_passage(build_passage()); setShowNote(false) }}>Done</Button>
         </Col>
         </Form.Group>
      </Popover.Body>
    </Popover>
  );

  useEffect(() => {
    setHighlight(marked);
    setNoteText(note);
    setIsVital(vital);
  }, [marked]);

  const handleClick = () => {
    if (highlight) {
      setHighlight(false);
      setShowNote(false);
      setIsVital(false);
      setNoteText("");
      del_passage(build_passage());
    } else {
      setHighlight(true);
      setShowNote(true);
      add_passage(build_passage());
    }
  };

  return (
    <OverlayTrigger 
      trigger={undefined} 
      show={showNote} 
      placement="auto"
      overlay={popover}>
      <span
        style={{ backgroundColor: highlight ? "yellow" : "inherit" }}
        onClick={handleClick}
        onMouseEnter={() => { if (highlight && !showNote) setShowNote(true) }}
        onMouseLeave={() => { if (highlight && showNote) setShowNote(false)}}
      >
        {children}
      </span>
    </OverlayTrigger>
  );
};

DocSentence.propTypes = {
  key: PropTypes.number,
  sentence: PropTypes.string.isRequired,
  marked: PropTypes.bool,
  note: PropTypes.string,
  vital: PropTypes.bool,
  add_passage: PropTypes.func,
  del_passage: PropTypes.func,
  children: PropTypes.node,
};

export default function DocumentView({ document, judgment, add_passage, del_passage }) {
  const [sentences, setSentences] = useState([]);

  useEffect(() => {
    const lang_map = {
      eng: "en",
      fas: "fa",
      arb: "ar",
      rus: "ru",
      zho: "zh",
    };
    const lang = (document && document["lang"] in lang_map) ? lang_map[document["lang"]] : "en";
    const sents = document ? segment(lang, document.text).map((s) => `${s} `) : [];
    setSentences(sents);
  }, [document]);

  var textdir = "";
  var textclass = "article-text";
  if (document && (document["lang"] === "arb" || document["lang"] === "fas")) {
    textdir = "rtl";
    textclass = "text-right article-text";
  }

  let highlights = {};
  let notes = {};
  let vital = {};
  if (judgment) {
    if (Array.isArray(judgment)) {
      judgment.forEach((e) => { highlights[e.sentence] = true; notes[e.sentence] = e.note; vital[e.sentence] = e.vital });
    } else {
      highlights[judgment.sentence] = true;
    }
  }

  return (
    <div>
      <div dir={textdir} className={textclass}>
        <h1>{document && document.title}</h1>
      </div>
      <div dir={textdir} className={textclass}>
        {sentences.map((sent, index) => (
          <DocSentence key={index} sentence={index} marked={index in highlights} 
            note={index in notes ? notes[index] : ""} 
            vital={index in vital ? vital[index] : false}
            add_passage={add_passage} del_passage={del_passage}>
            {sent}
          </DocSentence>
        ))}{" "}
      </div>
      <p></p>
    </div>
  );
}

DocumentView.propTypes = {
  document: PropTypes.object,
  judgment: PropTypes.object,
  add_passage: PropTypes.func,
  del_passage: PropTypes.func,
};
  