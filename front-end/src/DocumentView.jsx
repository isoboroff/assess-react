import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col"
import Popover from "react-bootstrap/Popover";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import segment from "./sentencex";


const DocSentence = ({  key, sentence, marked, add_passage, del_passage, children  }) => {
  const [highlight, setHighlight] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const me = { sentence: sentence, text: children };

  const popover = (
    <Popover id="note" onMouseEnter={() => setShowNote(true)} className="w-25">
      <Popover.Header as="h3">Enter note</Popover.Header>
      <Popover.Body>
        <Form.Group as={Row} className="align-items-center">
          <Col>
         <Form.Control type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}/>
         </Col>
         <Col className="col-auto">
         <Button onClick={() => { add_passage(me); setShowNote(false) }}>Done</Button>
         </Col>
         </Form.Group>
      </Popover.Body>
    </Popover>
  );

  useEffect(() => {
    setHighlight(marked);
  }, [marked])

  useEffect(() => {
    me.note = noteText;
  }, [noteText]);

  const handleClick = () => {
    if (highlight) {
      setHighlight(false);
      setShowNote(false);
      setNoteText("");
      del_passage(me);
    } else {
      setHighlight(true);
      setShowNote(true);
      add_passage(me);
    }
  };

  return (
    <OverlayTrigger 
      trigger={undefined} 
      show={showNote} 
      placement="top" overlay={popover}>
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
  if (judgment) {
    if (Array.isArray(judgment)) {
      judgment.forEach((e) => { highlights[e.sentence] = true });
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
          <DocSentence key={index} sentence={index} marked={index in highlights} add_passage={add_passage} del_passage={del_passage}>
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
