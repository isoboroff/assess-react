import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

import segment from "./sentencex";

const DocSentence = ({  key, sentence, marked, add_passage, del_passage, children  }) => {
  const [highlight, setHighlight] = useState(false);
  const me = { sentence: sentence, text: children };

  useEffect(() => {
    setHighlight(marked);
  }, [marked])

  const handleClick = () => {
    if (highlight) {
      setHighlight(false);
      del_passage(me);
    } else {
      setHighlight(true);
      add_passage(me);
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
