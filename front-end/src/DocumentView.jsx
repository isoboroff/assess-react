import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

import segment from "./sentencex";

const DocSentence = ({ docid, sentence, marked, children, note_passage }) => {
  const [highlight, setHighlight] = useState(false);

  // const me = { docid: docid, sentence: sentence, text: children };

  useEffect(() => {
    if (marked) {
      setHighlight(true);
      return;
    }
  }, [children, marked]);

  const handleClick = () => {
    if (highlight) {
      setHighlight(false);
      note_passage({ sentence: sentence, text: children })
    } else {
      setHighlight(true);
      // dispatch({ type: ActionType.NOTE_HIGHLIGHT, payload: me });
    }
  };

  return (
    <span
      style={{ backgroundColor: highlight ? "yellow" : "inherit" }}
      onClick={handleClick}
    >
      {children}
    </span>
  );
};

DocSentence.propTypes = {
  docid: PropTypes.string.isRequired,
  sentence: PropTypes.string.isRequired,
  marked: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default function DocumentView({ document, judgment, note_passage }) {
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

  return (
    <div>
      <div dir={textdir} className={textclass}>
        <h1>{document && document.title}</h1>
      </div>
      <div dir={textdir} className={textclass}>
        {sentences.map((sent, index) => (
          <DocSentence key={index} index={index} note_passage={note_passage}>
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
};
