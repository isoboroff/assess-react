import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Collapse from "react-bootstrap/Collapse";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

import { sha256 } from "hash-wasm";

import Pool from "./Pool";
import Description from "./Description";
import Highlightable from "./Highlightable";
import useKeyPress from "./useKeyPress";
import Panel from "./Panel";

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
  username: "",
  current: -1,
  cur_doc: "",
  topic: "",
  scan_terms: "",
  summary: "",
  pool: [],
};

/* These are actions which change the application state.
 * Setting them up this way lets the compiler check for typos.
 */
const Actions = Object.freeze({
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOAD_POOL: "LOAD_POOL",
  FETCH_DOC: "FETCH_DOC",
  JUDGE: "JUDGE",
  SAVE_SCAN_TERMS: "SAVE_SCAN_TERMS",
  SUMMARY: "SUMMARY",
});

/* And this function, called a "reducer", updates the application state
 * appropriately for each action
 */
function assess_reducer(state, action) {
  switch (action.type) {
    case Actions.LOGIN:
      window.localStorage.setItem("user", action.payload.username);
      return {
        ...state,
        username: action.payload.username,
      };

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
        summary: action.payload.summary ? action.payload.summary : "",
      };

    case Actions.FETCH_DOC:
      window.localStorage.setItem("current", action.payload.current);
      return {
        ...state,
        current: action.payload.current,
        doc: action.payload.doc,
      };

    case Actions.JUDGE:
      // Payload: docid, judgment, passage, subtopics
      // Update the judgment of the document that was judged
      const update = action.payload;
      const new_pool = state.pool.map((e) => {
        if (e.docid === update.docid) {
          // make sure update has all the stuff
          let new_entry = { docid: e.docid, judgment: update.judgment };
          if (update.passage) {
            if (update.passage.clear) {
              new_entry.passage = [];
            } else if (Array.isArray(update.passage)) {
              new_entry.passage = update.passage.slice();
            } else if (e.passage) {
              new_entry.passage = [...e.passage].slice();
              new_entry.passage.push(update.passage);
            } else {
              new_entry.passage = [update.passage];
            }
          } else {
            if (e.passage) {
              new_entry.passage = e.passage;
            }
          }

          return new_entry;
        } else {
          return e;
        }
      });
      return { ...state, pool: new_pool };

    case Actions.SAVE_SCAN_TERMS:
      if (action.payload.scan_terms)
        window.localStorage.setItem("scan_terms", action.payload.scan_terms);
      else window.localStorage.removeItem("scan_terms");
      return {
        ...state,
        scan_terms: action.payload.scan_terms,
      };

    case Actions.SUMMARY:
      window.localStorage.setItem("summary", action.payload.text);
      return {
        ...state,
        summary: action.payload.text,
      };

    default:
      return state;
  }
}

/* React Contexts allow us to store a value and get it back down deep in
 * the DOM tree, without needing to pass the value all the way down
 * through the properties at each node.
 */
const AssessDispatch = React.createContext(null);
// only use the AssessState context for reading state.  If you want to
// change the state, you have to dispatch an action.
const AssessState = React.createContext(null);

/* A modal dialog to force logging in.
 * This used to be in App(), but I decided to move it out to a separate
 * component.
 */
function LoginModal(props) {
  const [username, set_username] = useState("");
  const [password, set_password] = useState("");
  const [error, set_error] = useState(false);
  const dispatch = useContext(AssessDispatch);

  async function hash(password) {
    const te = new TextEncoder();
    const encoded = te.encode(password.normalize("NFKC"));
    const hashval = await sha256(encoded);
    return hashval;
  }

  const do_login = useCallback(() => {
    // Send username and hashed password to the server.
    // Server responds 200 for ok login, 403 for denied
    set_error(false);
    hash(password)
      .then((pwhash) => fetch("login?u=" + username + "&p=" + pwhash))
      .then((response) => {
        if (response.ok) {
          dispatch({ type: Actions.LOGIN, payload: { username: username } });
          props.set_required(false);
        } else {
          set_error(true);
        }
      });
  }, [password, username]);

  return (
    <Modal
      show={props.login_required}
      onHide={do_login}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title>Please log in</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? <p>Invalid username or password.</p> : ""}
        <Form.Control
          type="text"
          placeholder="user"
          value={username}
          onChange={(e) => set_username(e.target.value)}
        />
        <Form.Control
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => set_password(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              do_login();
            }
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => do_login()}>
          Log in
        </Button>
      </Modal.Footer>
    </Modal>
  );
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
            {Object.getOwnPropertyNames(props.inbox).map((topic) => (
              <tr onClick={() => props.load_pool(topic)}>
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
    <Stack direction="horizontal" gap={3}>
      <div className="p-2 col-10">
        <Form.Control
          placeholder="Scan terms"
          className="mx-3"
          dir={props.dir}
          value={props.scan_terms}
          onChange={change}
          onKeyDown={update}
        />
      </div>
      <div className="p-2 ms-auto col-md-auto">
        <Button variant="primary" onClick={apply}>
          Apply
        </Button>
        <Button variant="secondary" onClick={clear}>
          Clear
        </Button>
      </div>
    </Stack>
  );
}

// Clippy shows the passages marked in the pool, and lets you
// go to the passage

function Clipping(props) {
  return (
    <ListGroup.Item action onClick={() => props.fetch_doc(props.docid)}>
      {props.seq}: {props.clip.text}
    </ListGroup.Item>
  );
}

function Clippy(props) {
  let clips = [];
  let seq = 0;

  for (const pool_entry of props.pool) {
    if (pool_entry.passage) {
      for (const p of pool_entry.passage) {
        seq += 1;
        clips.push(
          <Clipping
            fetch_doc={props.fetch_doc}
            docid={pool_entry.docid}
            clip={p}
            seq={seq}
          />,
        );
      }
    }
  }
  return (
    <>
      <Form.Label>Clippy</Form.Label>
      <ListGroup> {clips} </ListGroup>
    </>
  );
}

// A place for the user to type a summary or something
function SummaryBox(props) {
  const [text_cache, set_text_cache] = useState("");
  const [last, set_last] = useState("");
  const saveTimeoutRef = useRef(null);
  const state = useContext(AssessState);
  const dispatch = useContext(AssessDispatch);

  useEffect(() => set_text_cache(state.summary), []);

  const save_summary = (text) => {
    fetch("summary_save?u=" + state.username + "&t=" + state.topic, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(text),
    }).then((response) => {
      set_last(text);
      //if (response.ok)
      //  dispatch({ type: Actions.SUMMARY, payload: text});
    });
  };

  // This effect is a "debouncer".  We set a timer to save the summary
  // every second.  It depends on the summary, so if the summary changes,
  // it clears the timer and sets a new one.  This way, we only save
  // once the user stops typing.
  useEffect(() => {
    if (text_cache !== last) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        save_summary(text_cache);
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [text_cache]);

  const handle_change = (e) => {
    set_text_cache(e.target.value);
    dispatch({ type: Actions.SUMMARY, payload: e.target.value });
  };

  return (
    <Form>
      <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
        <Form.Label>Summary</Form.Label>
        <Form.Control
          as="textarea"
          rows={props.rows}
          onChange={handle_change}
          onKeyDown={(e) => e.stopPropagation()}
          value={state.summary}
          placeholder="Type your summary here..."
        />
      </Form.Group>
    </Form>
  );
}

// Use this in the place of 'assess_reducer' in App's useReducer call
// to have it print the new state on each dispatch.
const reducer_debug = (state, action) => {
  const new_state = assess_reducer(state, action);
  console.log(new_state);
  return new_state;
};

/*
 * The "app".  The main interface pieces here are a modal for logins,
 * selecting a topic to load, and judgment buttons for judging the
 * currently displayed doc.  Wraps the Pool in one subpane and a
 * document in the other.  The Highlightable component handles
 * document rendering.
 */
function App() {
  const [state, dispatch] = useReducer(assess_reducer, initial_state);
  const [login_required, set_login_required] = useState(false);
  const [topic_requested, set_topic_requested] = useState(false);
  const [show_topic_dialog, set_show_topic_dialog] = useState(false);
  const [inbox, set_inbox] = useState({});
  const [scan_terms, set_scan_terms] = useState("");
  const [pool_filter, set_pool_filter] = useState("all");

  /* Effect to fire just before initial render */
  useEffect(() => {
    if (state.username === "") {
      // Try to restore state from the browser's local storage.
      // First check for a username.
      const stored_username = window.localStorage.getItem("user");
      if (stored_username) {
        dispatch({
          type: Actions.LOGIN,
          payload: { username: stored_username },
        });

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
          load_pool(stored_username, cur_topic, cur_doc);
        }
      } else {
        set_login_required(true);
      }
    }
  }, [state.username]);

  /* Load the "inbox", the list of topics to do and how much has been done. */
  const load_inbox = useCallback((username) => {
    fetch("inbox?u=" + state.username)
      .then((response) => response.json())
      .then((data) => set_inbox(data));
  });

  /* If someone clicks "Load topic", we need to refresh the inbox and
   * put up the load-topic dialog. */
  useEffect(() => {
    if (topic_requested && state.username !== "") {
      load_inbox(state.username);
      set_topic_requested(false);
      set_show_topic_dialog(true);
    }
  }, [topic_requested]);

  // Load a pool
  const load_pool = useCallback((username, topic, current = 0) => {
    fetch("pool?u=" + username + "&t=" + topic)
      .then((response) => response.json())
      .then((data) => {
        if (data.last) current = data.last;
        const desc_obj = data.desc ? JSON.parse(data.desc) : {};
        const summ_obj = data.summary ? data.summary : "";
        dispatch({
          type: Actions.LOAD_POOL,
          payload: {
            topic: topic,
            pool: data.pool,
            desc: desc_obj,
            summary: summ_obj,
          },
        });
        return fetch(
          "doc?u=" +
            username +
            "&t=" +
            topic +
            "&d=" +
            data.pool[current].docid,
        );
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
    load_pool(state.username, topic, current);
  });

  // This is the routine that fetches a doc by index in the pool
  const load_pool_item = useCallback((i) => {
    if (i < 0 || i >= state.pool.length) return;

    const docid = state.pool[i].docid;
    fetch("doc?t=" + state.topic + "&u=" + state.username + "&d=" + docid)
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

  const load_doc = useCallback((docid) => {
    for (let i = 0; i < state.pool.length; i++) {
      if (state.pool[i].docid == docid) load_pool_item(i);
    }
    return "";
  });

  const judge_current = useCallback(
    ({ judgment = "0", passage = null, subtopics = {} }) => {
      const docid = state.pool[state.current].docid;

      if (passage && (judgment === "0" || judgment === "-1")) judgment = "2";

      if (judgment === "0") {
        passage = { clear: true }; // Clear any passage judgments
        subtopics = []; // Clear any subtopic judgments
      }

      let judge_payload = {
        docid: docid,
        judgment: judgment,
      };

      if (passage) {
        judge_payload.passage = passage;
      }
      if (subtopics && Object.keys(subtopics).length > 0) {
        judge_payload.subtopics = subtopics;
      }

      fetch("judge?u=" + state.username + "&t=" + state.topic + "&d=" + docid, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(judge_payload),
      }).then((response) => {
        if (response.ok)
          dispatch({ type: Actions.JUDGE, payload: judge_payload });
      });
    },
  );

  const note_passage = useCallback((passage) => {
    let judgment = state.pool[state.current].judgment;
    if (judgment === "-1" || judgment === "0") judgment = "2";
    judge_current({ judgment: judgment, passage: passage });
  });

  const drop_passage = useCallback((pid) => {
    pid = parseInt(pid);
    const jobj = state.pool[state.current];
    let new_plist = jobj.passage.filter((e) => e.start !== pid);
    if (new_plist.length == 0) new_plist = { clear: true };
    judge_current({ judgment: jobj.judgment, passage: new_plist });
  });

  const note_subtopic = useCallback((subchecks) => {
    let judgment = state.pool[state.current].judgment;

    if (Object.values(subchecks).some((x) => x === true)) {
      if (judgment === "-1" || judgment === "0") {
        judgment = "1";
      }
    }
    judge_current({ judgment: judgment, subtopics: subchecks });
  });

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
      <ButtonGroup>
        <Button
          variant={rel_levels[i].color}
          onClick={() => judge_current({ judgment: i })}
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
   */
  const onKeyPress = (event) => {
    switch (event.key) {
      case "0":
      case "1":
      case "2":
      case "3":
        judge_current({ judgment: event.key });
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
        {/************** Modals */}
        <Container fluid className="d-flex flex-column vh-100 overflow-hidden">
          <LoginModal
            login_required={login_required}
            set_required={set_login_required}
          />
          <LoadTopicModal
            show_topic_dialog={show_topic_dialog}
            set_show_topic_dialog={set_show_topic_dialog}
            inbox={inbox}
            load_pool={load_pool_for_current_user}
          />

          {/************** Header line: load pool, filter pool, judgment buttons, logout button */}
          <Row xs={12} className="fixed-top w-100">
            <Col>
              <Stack direction="horizontal" gap={3}>
                <div className="p-2">
                  <FontAwesomeIcon icon={faCoffee} />{" "}
                  <span className="navbar-brand">Assess</span>
                </div>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => set_topic_requested(true)}
                  >
                    {" "}
                    Load Pool
                  </Button>
                </div>
                <div>
                  {state.current + 1} of {state.pool.length}
                </div>
                <div>
                  <Form.Control
                    as="select"
                    onChange={(e) => set_pool_filter(e.target.value)}
                  >
                    <option>all</option>
                    <option>unjudged</option>
                    {Object.getOwnPropertyNames(rel_levels).map((i) => (
                      <option value={i}>{rel_levels[i].label}</option>
                    ))}
                  </Form.Control>
                </div>
                <div>{judgment_buttons}</div>
                <div className="ms-auto">
                  <Button onClick={() => dispatch({ type: Actions.LOGOUT })}>
                    Log out {state.username}
                  </Button>
                </div>
              </Stack>
            </Col>
          </Row>

          {/************** Scanterms */}
          <Row className="mt-5 pt-2"> </Row>
          <Row>
            <ScanTerms
              dir={state.doc && state.doc["lang"] === "fas" ? "rtl" : ""}
              scan_terms={scan_terms}
              set_scan_terms={set_scan_terms}
            />
          </Row>

          {/************** Main: pool column and topic/document column */}
          <Container
            fluid
            style={{ height: "100vh", padding: 0, "margin-top": "1em" }}
          >
            <Row style={{ height: "60%" }}>
              <Col md={4} style={{ height: "100%" }}>
                <Panel>
                  <Pool
                    user={state.username}
                    topic={state.topic}
                    rel_levels={rel_levels}
                    pool={state.pool}
                    current={state.current}
                    filter={pool_filter}
                    fetch_doc={load_pool_item}
                  />
                </Panel>
              </Col>
              <Col md={8} style={{ height: "100%" }}>
                <Panel ref={docDiv}>
                  <Description
                    desc={state.desc}
                    topic={state.topic}
                    note_subtopic={note_subtopic}
                    rel={
                      state.current >= 0 && state.pool[state.current].subtopics
                        ? state.pool[state.current].subtopics
                        : null
                    }
                  />
                  <Highlightable
                    content={state.doc}
                    scan_terms={state.scan_terms}
                    rel={
                      state.current >= 0 && state.pool[state.current]
                        ? state.pool[state.current]
                        : {}
                    }
                    note_passage={note_passage}
                    del_passage={drop_passage}
                  />
                </Panel>
              </Col>
            </Row>
            <Row className="mt-5 pt-2"> </Row>
            <Row style={{ height: "30%", "padding-bottom": "50px" }}>
              <Col md={4} style={{ height: "100%" }}>
                <Panel>
                  <Clippy pool={state.pool} fetch_doc={load_doc} />
                </Panel>
              </Col>
              <Col md={8} style={{ height: "100%" }}>
                <Panel>
                  <SummaryBox rows={6} summary={state.summary} />
                </Panel>
              </Col>
            </Row>
          </Container>
        </Container>
      </AssessState.Provider>
    </AssessDispatch.Provider>
  );
}

export default App;
