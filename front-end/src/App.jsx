/* eslint-disable react/prop-types */
/* eslint-disable no-prototype-builtins */
import {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
  useCallback,
} from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Container from "react-bootstrap/Container";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";

import { AssessState, AssessDispatch } from "./Contexts";
import Pool from "./Pool";
import Description from "./Description";
import DocumentView from "./DocumentView";
import useKeyPress from "./useKeyPress";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

/* Mapping relevance levels to labels to colors in the interface */
const rel_levels = {
  0: { label: "irrelevant", color: "secondary" },
  1: { label: "topical", color: "info" },
  2: { label: "valuable", color: "primary" },
  3: { label: "very valuable", color: "success" },
};

/* This is the application state. */
const initial_state = {
  current: -1,
  cur_doc: "",
  topic: "",
  scan_terms: "",
  pool: [],
};

/* These are actions which change the application state. */
export const Actions = Object.freeze({
  LOGOUT: "LOGOUT",
  LOAD_POOL: "LOAD_POOL",
  FETCH_DOC: "FETCH_DOC",
  JUDGE: "JUDGE",
  SAVE_SCAN_TERMS: "SAVE_SCAN_TERMS",
  SET_JUDGMENT: "SET_JUDGMENT",
  SET_PASSAGES: "SET_PASSAGES",
});

/* And this function, called a "reducer", updates the application state
 * appropriately for each action
 */
function assess_reducer(state, action) {
  switch (action.type) {
    case Actions.LOGOUT:
      window.localStorage.clear();
      return { ...initial_state };

    case Actions.LOAD_POOL:
      window.localStorage.setItem("topic", action.payload.topic);
      return {
        ...state,
        topic: action.payload.topic,
        desc: action.payload.desc,
        current: 0,
        pool: action.payload.pool,
      };

    case Actions.FETCH_DOC:
      window.localStorage.setItem("current", action.payload.current);
      return {
        ...state,
        current: action.payload.current,
        doc: action.payload.doc,
      };

    case Actions.JUDGE: {
      // Update the judgment of the document that was judged
      let update = { judgment: action.payload.judgment };
      if ('passage' in action.payload) {
        if ('clear' in action.payload.passage)
          update.passage = [];
        else update.passage = action.payload.passage;
      }
      if ('subtopics' in action.payload)
        update.subtopics = action.payload.subtopics;

      let newPool = state.pool.map((entry) => {
        if (entry.docid === action.payload.docid) {
          console.log(entry, update);
          if ('passage' in update) {
            if ('passage' in entry) {
              update.passage = entry.passage.concat(update.passage);
            } else {
              update.passage = [update.passage];
            }
          }
          return { ...entry, ...update };
        }
        else return entry;
      });
      return {
        ...state,
        pool: newPool,
      };
    }

    case Actions.ADD_HIGHLIGHT: {
      const passage = action.payload;
      let newPool = state.pool.map((entry) => {
        if (entry.docid == passage.docid) {
          if ('passage' in entry) {
            if (Array.isArray(entry.passage)) {
              entry.passage = [...entry.passage, passage];
            } else {
              entry.passage = [entry.docid.passage].concat(passage);
            }
          } else {
            entry.passage = [passage];
          }
          return { ...entry }
        }
        else return entry;
      });
      return { ...state, pool: newPool };
    }

    case Actions.DELETE_HIGHLIGHT: {
      const passage = action.payload;
      let newPool = state.pool.map((entry) => {
        if (entry.docid == passage.docid) {
          if ('passage' in entry.docid) {
            entry.passage = entry.passage.filter((p) => p.docid != passage.docid);
          }
          return {...entry}
        } else return entry;
      })
      return { ...state, pool: newPool };
    }

    case Actions.SAVE_SCAN_TERMS:
      if (action.payload.scan_terms)
        window.localStorage.setItem("scan_terms", action.payload.scan_terms);
      else window.localStorage.removeItem("scan_terms");
      return {
        ...state,
        scan_terms: action.payload.scan_terms,
      };

    case Actions.SET_JUDGMENT: {
      let newPool = state.pool.map((entry) => {
        if (entry.docid === action.payload.docid) {
          return { ...entry, judgment: action.payload.judgment };
        } else {
          return entry;
        }
      });
      return { ...state, pool: newPool };
    }

    case Actions.SET_PASSAGES: {
      let newPool = state.pool.map((entry) => {
        if (entry.docid === action.payload.docid) {
          return { ...entry, passage: action.payload.passage }
        } else {
          return entry;
        }
      });
      return { ...state, pool: newPool };
    }

    default:
      return state;
  }
}

/*
 * A modal for loading the topic.  This is much nicer than typing a topic
 * number in a form, which is error prone.  As a bonus, we can show
 * for each topic how big it is and how much is left to do.
 */
function LoadTopicModal(props) {
  return (
    <Modal show={props.show_topic_dialog}>
      <Modal.Header>
        <Modal.Title>Select a topic to load</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <table className="table table-hover">
          <thead style={{ position: "sticky" }}>
            <tr>
              <th scope="col">Topic</th>
              <th scope="col">Length</th>
              <th scope="col">Unjudged</th>
            </tr>
          </thead>
          <tbody>
            {Object.getOwnPropertyNames(props.inbox)
              .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
              .map((topic) => (
                <tr key={topic} onClick={() => props.load_pool(topic)}>
                  <td>{topic}</td>
                  <td>{props.inbox[topic][0]}</td>
                  <td>{props.inbox[topic][0] - props.inbox[topic][1]}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={() => props.set_show_topic_dialog(false)}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function ScanTerms(props) {
  const dispatch = useContext(AssessDispatch);
  const change = useCallback((e) => {
    props.set_scan_terms(e.target.value);
    e.preventDefault();
    e.stopPropagation();
  });
  const update = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dispatch({
        type: Actions.SAVE_SCAN_TERMS,
        payload: { scan_terms: props.scan_terms },
      });
    }
    e.stopPropagation();
  });
  const apply = useCallback(() => {
    dispatch({
      type: Actions.SAVE_SCAN_TERMS,
      payload: { scan_terms: props.scan_terms },
    });
  });
  const clear = useCallback(() => {
    props.set_scan_terms("");
    dispatch({
      type: Actions.SAVE_SCAN_TERMS,
      payload: { scan_terms: null },
    });
  });

  return (
    <Col>
      <Form>
        <Row className="align-items-center">
          <Col xs={10}>
        <Form.Control
          placeholder="Scan terms"
          dir={props.dir}
          value={props.scan_terms}
          onChange={change}
          onKeyDown={update}
        />
          </Col>
          <Col>
            <Button className="mx-3" variant="primary" onClick={apply}>
          Apply
        </Button>
        <Button variant="secondary" onClick={clear}>
          Clear
        </Button>
          </Col>
        </Row>
      </Form>
    </Col>
  );
}

/*
 * The "app".  The main interface pieces here are a modal for logins, selecting a
 * topic to load, and judgment buttons for judging the currently displayed doc.
 * Wraps the Pool in one subpane and a BetterDocument in the other.  The
 * BetterDocument component handles document rendering.
 */
function App() {
  const [state, dispatch] = useReducer(assess_reducer, initial_state);
  const [topic_requested, set_topic_requested] = useState(false);
  const [show_topic_dialog, set_show_topic_dialog] = useState(false);
  const [inbox, set_inbox] = useState({});
  const [scan_terms, set_scan_terms] = useState("");
  const [pool_filter, set_pool_filter] = useState("all");
  const [translate, set_translate] = useState(false);

  /* Effect to fire just before initial render */
  useEffect(() => {
        // check for scan terms
        const scan_terms = window.localStorage.getItem("scan_terms");
        if (scan_terms) {
          dispatch({
            type: Actions.SAVE_SCAN_TERMS,
            payload: { scan_terms: scan_terms },
          });
          set_scan_terms(scan_terms);
        }

        // Then, check for last topic loaded
        const cur_topic = window.localStorage.getItem("topic");
        if (cur_topic) {
          // And last document viewed?  If not just set to 0
          let cur_doc = window.localStorage.getItem("current");
          if (cur_doc) cur_doc = parseInt(cur_doc);
          else cur_doc = 0;
      load_pool(cur_topic, cur_doc);
    }
  }, []);

  /* Load the "inbox", the list of topics to do and how much has been done. */
  const load_inbox = useCallback(() => {
    fetch("inbox")
      .then((response) => response.json())
      .then((data) => set_inbox(data));
  });

  /* If someone clicks "Load topic", we need to refresh the inbox and
   * put up the load-topic dialog. */
  useEffect(() => {
    if (topic_requested) {
      load_inbox();
      set_topic_requested(false);
      set_show_topic_dialog(true);
    }
  }, [topic_requested]);

  const load_pool = useCallback((topic, current = 0) => {
    fetch("pool?t=" + topic)
      .then((response) => response.json())
      .then((data) => {
        if (data.last) current = data.last;
        const desc_obj = JSON.parse(data.desc);
        dispatch({
          type: Actions.LOAD_POOL,
          payload: {
            topic: topic,
            pool: data.pool,
            desc: desc_obj,
          },
        });
        return fetch("doc?t=" + topic + "&d=" + data.pool[current].docid);
      })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then((data) => {
        dispatch({
          type: Actions.FETCH_DOC,
          payload: {
            doc: data,
            current: current,
          },
        });
        set_show_topic_dialog(false);
      });
  });

  const load_pool_for_current_user = useCallback((topic, current = 0) => {
    load_pool(topic, current);
  });

  const load_pool_item = useCallback((i) => {
    if (i < 0 || i >= state.pool.length) return;

    const docid = state.pool[i].docid;
    const index = translate ? "ragtime-mt" : "ragtime";
    fetch("doc?i=" + index + "&t=" + state.topic + "&d=" + docid)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return "";
      })
      .then((data) => {
        dispatch({
          type: Actions.FETCH_DOC,
          payload: {
            current: i,
            doc: data,
          },
        });
      });
  });

  const handleTranslateToggle = () => {
    set_translate(!translate);
  };
  useEffect(() => {
    if (state.current > 0 && state.current < state.pool.length) {
      load_pool_item(state.current);
    }
  }, [translate]);


  const judge = (judgment) => {
    const docid = state.pool[state.current].docid;
    let log_payload = { docid: docid, judgment: judgment };
    if (judgment == "0") {
      log_payload.passage = [];
    } else if ('passage' in state.pool[state.current]) {
      log_payload.passage = state.pool[state.current].passage;
    }
    fetch("judge?t=" + state.topic + "&d=" + state.pool[state.current].docid, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log_payload) 
    }).then((response) => {
      if (response.ok) {
        dispatch({ 
          type: Actions.SET_JUDGMENT, 
          payload: { docid: docid, judgment: judgment }
        });
        if (judgment == "0") {
          dispatch({ 
            type: Actions.SET_PASSAGES,
            payload: { docid: docid, passage: [] }
           });
        }
      }
    });
  }

  const add_passage = (passage) => {
    const docid = state.pool[state.current].docid;
    let judgment = state.pool[state.current].judgment;
    let cur_pass = ('passage' in state.pool[state.current]) ? state.pool[state.current].passage : [];
    cur_pass = cur_pass.filter((entry) => (entry.sentence != passage.sentence));
    let new_pass = cur_pass.concat(passage);
    let log_payload = { docid: docid, judgment: judgment, passage: new_pass };
    if (judgment === "-1" || judgment === "0") {
      log_payload.judgment = "2";
    }
    fetch("judge?t=" + state.topic + "&d=" + docid, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log_payload) 
    }).then((response) => {
      if (response.ok) {
        if (log_payload.judgment != judgment) {
          dispatch({ 
            type: Actions.SET_JUDGMENT, 
            payload: { docid: docid, judgment: log_payload.judgment}
          });
        }
        dispatch({ 
          type: Actions.SET_PASSAGES, 
          payload: { docid: docid, passage: new_pass }
        });
      }
    });
  };

  const del_passage = (passage) => {
    if (!('passage' in state.pool[state.current]) || state.pool[state.current].passage.length == 0)
      return;
    const docid = state.pool[state.current].docid;
    let judgment = state.pool[state.current].judgment;
    let passages = state.pool[state.current].passage.filter((p) => p.sentence != passage.sentence);
    let log_payload = { docid: docid, judgment: judgment, passage: passages };
    if (passages.length == 0) {
      log_payload.judgment = "0";
    }
    fetch("judge?t=" + state.topic + "&d=" + state.pool[state.current].docid, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log_payload) 
    }).then((response) => {
      if (response.ok) {
        if (log_payload.judgment == "0") {
          dispatch({ 
            type: Actions.SET_JUDGMENT, 
            payload: { docid: docid, judgment: "0" }
          });
          dispatch({ 
            type: Actions.SET_PASSAGES,
            payload: { docid: docid, passage: [] }
           });
        } else {
          dispatch({ 
            type: Actions.SET_PASSAGES, 
            payload: { docid: docid, passage: passages }
          });
        }
      }
    });
  };

  /*
   * The judgment buttons are colored according to the key at the top,
   * and the judgment for the currently selected document is bolded.
   */
  const judgment_buttons = Object.getOwnPropertyNames(rel_levels).map((i) => {
    let style = "font-weight-normal";
    if (
      state.current >= 0 &&
      state.current < state.pool.length &&
      i === state.pool[state.current].judgment
    ) {
      style = "font-weight-bold";
    }
    return (
      <ButtonGroup key={i}>
        <Button
          variant={rel_levels[i].color}
          onClick={() => judge(i)}
        >
          <span className={style}>{rel_levels[i].label}</span>
        </Button>
      </ButtonGroup>
    );
  });

  /*
   * Keyboard controls: number keys apply the judgment level to the
   * current document.  'n' and 'p' move to the next and previous
   * pool document respectively.   The spacebar judges the current
   * document irrelevant and moves to the next document.
  const onKeyPress = (event) => {
    switch (event.key) {
      case "0":
      case "1":
      case "2":
      case "3":
        judge(event.key);
        break;
      case "n":
        load_pool_item(state.current + 1);
        break;
      case "p":
        load_pool_item(state.current - 1);
        break;
    }
  };

  useKeyPress(["n", "p", "0", "1", "2", "3"], onKeyPress);
   */

  const docDiv = useRef(null);

  // When the document is updated, scroll to the top.
  useEffect(() => {
    if (docDiv.current) {
      docDiv.current.scrollTo(0, 0);
    }
  }, [state.doc]);

  return (
    <AssessDispatch.Provider value={dispatch}>
      <AssessState.Provider value={state}>
        <Container
          fluid
          className="d-flex flex-column min-vh-100 overflow-hidden"
        >
          {/************** Modals */}
          <LoadTopicModal
            show_topic_dialog={show_topic_dialog}
            set_show_topic_dialog={set_show_topic_dialog}
            inbox={inbox}
            load_pool={load_pool_for_current_user}
          />

          {/************** Header line: load pool, filter pool, judgment buttons, logout button */}
          <Row xs={12} className="fixed-top align-items-center flex-shrink-0">
            <Col xs="auto" className="flex-row flex-shrink-0 mx-3">
              <FontAwesomeIcon icon={faCoffee} />{" "}
              <span className="navbar-brand">Assess</span>
            </Col>
            <Col xs="auto" className="flex-shrink-1">
              <Button
                variant="primary"
                onClick={() => set_topic_requested(true)}
              >
                Load Pool
              </Button>
            </Col>
            <Col xs="auto">
              {state.current + 1} of {state.pool.length}
            </Col>
            <Col xs="auto">
              <Form.Control
                as="select"
                onChange={(e) => set_pool_filter(e.target.value)}
              >
                <option>all</option>
                <option>unjudged</option>
                {Object.getOwnPropertyNames(rel_levels).map((i) => (
                  <option key={i} value={i}>
                    {rel_levels[i].label}
                  </option>
                ))}
              </Form.Control>
            </Col>
            <Col xs="auto" className="mr-auto">
              {judgment_buttons}
            </Col>
            <Col xs="auto" className="mr-auto">
              <Form.Check
                type="switch"
                label="Translate"
                id="mt-switch"
                checked={translate}
                onClick={() => handleTranslateToggle()}
              />
            </Col>
            <Col xs="auto" className="mx-3 mr-auto">
              <Button onClick={() => dispatch({ type: Actions.LOGOUT })}>
                Log out
              </Button>
            </Col>
          </Row>

          {/************** Scanterms */}
          <Row className="mt-5 pt-2"> </Row>
          <ScanTerms
            dir={state.doc && state.doc["lang"] === "fas" ? "rtl" : ""}
            scan_terms={scan_terms}
            set_scan_terms={set_scan_terms}
          />

          {/************** Main: pool column and topic/document column */}
          <Row className="mt-3 vh-full">
            <Col xs={4} className="vh-full overflow-auto">
              <Pool
                topic={state.topic}
                rel_levels={rel_levels}
                pool={state.pool}
                current={state.current}
                filter={pool_filter}
                fetch_doc={load_pool_item}
              />
            </Col>
            <Col ref={docDiv} xs={8} className="vh-full overflow-auto">
              <Description
                desc={state.desc}
                note_subtopic={() => {}}
                rel={
                  state.current >= 0 && state.pool[state.current].subtopics
                    ? state.pool[state.current].subtopics
                    : null
                }
              />
              <DocumentView 
                document={state.doc} 
                judgment={
                  state.current >= 0 && state.pool[state.current].passage
                    ? state.pool[state.current].passage
                    : ""
                }
                add_passage={add_passage}
                del_passage={del_passage}
              />
           </Col>
          </Row>
        </Container>
      </AssessState.Provider>
    </AssessDispatch.Provider>
  );
}

/*
              <Highlightable
                content={state.doc}
                scan_terms={state.scan_terms}
                rel={
                  state.current >= 0 && state.pool[state.current].passage
                    ? state.pool[state.current].passage
                    : ""
                }
                note_passage={note_passage}
              />
 */

export default App;
