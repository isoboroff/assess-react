import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Stack from "react-bootstrap/Stack";
import Popover from "react-bootstrap/Popover";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import segment from "./sentencex";

// A modal editor for setting/editing the highlight summary

const EditorDialog = ({show, setShow, the_note, the_vital, doSave}) => {
  const [note, setNote] = useState("");
  const [vital, setVital] = useState(false);

  useEffect(() => {
    if (show) {
      setNote(the_note);
      setVital(the_vital);
      console.log('showing editor', the_note, the_vital);
    }
  }, [show, the_note, the_vital]);

  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Summary</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Form.Check
            type="checkbox"
            label="Vital?"
            checked={vital}
            onClick={() => setVital(!vital)}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            doSave(note, vital);
            setShow(false);
          }}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

EditorDialog.propTypes = {
  show: PropTypes.bool,
  setShow: PropTypes.func,
  the_note: PropTypes.string, 
  the_vital: PropTypes.string, 
  doSave: PropTypes.func,
}

// An individual sentence in the document.
// You can click on it to highlight it, and that brings up the summary editor.
// After it's been clicked, hovering shows a Popover with the current summary
// The Popover has an edit button that brings up the editor dialog.
// Sentences, they be busy.
const DocSentence = ({
  key,
  sentence,
  judgment,
  add_passage,
  del_passage,
  children,
}) => {
  const [highlight, setHighlight] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(judgment ? judgment.note : "");
  const [isVital, setIsVital] = useState(judgment ? judgment.vital : false);
  const [showEditor, setShowEditor] = useState(false);

  const build_passage = () => {
    return {
      sentence: sentence,
      text: children,
      vital: isVital,
      note: noteText,
    };
  };

  const popover = (
    <Popover
      id="note"
      onMouseEnter={() => setShowNote(true)}
      onMouseLeave={() => setShowNote(false)}
      style={{ width: "500px" }}
    >
      <Popover.Body>
        <Stack direction="horizontal" gap={3}>
          <div className="p-2">
            {noteText} {isVital ? <strong>(vital)</strong> : ""}
          </div>
          <div className="ms-auto">
            <Button onClick={() => setShowEditor(true)}>Edit</Button>
          </div>
        </Stack>
      </Popover.Body>
    </Popover>
  );

  useEffect(() => {
    setHighlight(judgment ? true : false);
    setNoteText(judgment ? judgment.note : "");
    setIsVital(judgment ? judgment.vital : false);
  }, [judgment]);

  const handleClick = () => {
    if (highlight) {
      setHighlight(false);
      setShowNote(false);
      setIsVital(false);
      setNoteText("");
      del_passage(build_passage());
    } else {
      setHighlight(true);
      setShowEditor(true);
      add_passage(build_passage());
    }
  };

  const save_update = (note, vital) => {
    setNoteText(note);
    setIsVital(vital);
    add_passage(build_passage);
  };

  return (
    <>
      <EditorDialog show={showEditor} setShow={setShowEditor} note={noteText} vital={isVital} doSave={save_update}/>
      <OverlayTrigger
        trigger={undefined}
        show={showNote}
        placement="auto"
        overlay={popover}
      >
        <span
          style={{ backgroundColor: highlight ? "yellow" : "inherit" }}
          onClick={handleClick}
          onMouseEnter={() => {
            if (highlight && !showNote) setShowNote(true);
          }}
          onMouseLeave={() => {
            if (highlight && showNote) setShowNote(false);
          }}
        >
          {children}
        </span>
      </OverlayTrigger>
    </>
  );
};

DocSentence.propTypes = {
  key: PropTypes.number,
  sentence: PropTypes.string.isRequired,
  judgment: PropTypes.Map,
  add_passage: PropTypes.func,
  del_passage: PropTypes.func,
  children: PropTypes.node,
};

export default function DocumentView({
  document,
  judgment,
  add_passage,
  del_passage,
}) {
  const [sentences, setSentences] = useState([]);
  const [judgeMap, setJudgeMap] = useState(new Map());

  useEffect(() => {
    if (judgment) {
      const jmap = new Map();
      judgment.forEach((j) => {
        jmap.set(j.sentence, j);
      });
      // console.log("jmap is", jmap);
      setJudgeMap(jmap);
    }
  }, [judgment]);

  useEffect(() => {
    const lang_map = {
      eng: "en",
      fas: "fa",
      arb: "ar",
      rus: "ru",
      zho: "zh",
    };
    const lang =
      document && document["lang"] in lang_map
        ? lang_map[document["lang"]]
        : "en";
    let sentences = document ? segment(lang, document.text) : [];
    sentences = sentences.map((s) => `${s} `);
    // console.log("sentences are", sentences);
    setSentences(sentences);
  }, [document]);

  var textdir = "";
  var textclass = "article-text";
  if (document && (document["lang"] === "arb" || document["lang"] === "fas")) {
    textdir = "rtl";
    textclass = "text-right article-text";
  }

  return (
    <div>
      <div dir={textdir} className={textclass}>
        <h1>{document && document.title}</h1>
      </div>
      <div dir={textdir} className={textclass}>
        {sentences.map((sent, index) => (
          <DocSentence
            key={index}
            sentence={index}
            judgment={judgeMap.has(index) ? judgeMap.get(index) : null}
            add_passage={add_passage}
            del_passage={del_passage}
          >
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
