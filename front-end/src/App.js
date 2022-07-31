import React, { useState, useEffect, useReducer, useContext, useRef } from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Collapse from 'react-bootstrap/Collapse';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

import { sha256 } from 'hash-wasm';

import Highlightable from './Highlightable';
import useKeyPress from './useKeyPress';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

/* Mapping relevance levels to labels to colors in the interface */
const rel_levels = {
  '0': { label: 'irrelevant', color: 'secondary' },
  '1': { label: 'topical', color: 'info' },
  '2': { label: 'valuable', color: 'primary' },
  '3': { label: 'very valuable', color: 'success' },
};

/* This is the application state. */
const initial_state = {
  username: '',
  current: -1,
  cur_doc: '',
  topic: '',
  scan_terms: '',
  pool: []
};

/* These are actions which change the application state. */
const Actions = Object.freeze({
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOAD_POOL: 'LOAD_POOL',
  FETCH_DOC: 'FETCH_DOC',
  JUDGE: 'JUDGE',
  SAVE_SCAN_TERMS: 'SAVE_SCAN_TERMS'
});

/* And this function, called a "reducer", updates the application state
 * appropriately for each action
 */
function assess_reducer(state, action) {
  switch (action.type) {
    case Actions.LOGIN:
      window.localStorage.setItem('user', action.payload.username);
      return {
        ...state,
        username: action.payload.username
      };

    case Actions.LOGOUT:
      window.localStorage.clear();
      return { ...initial_state };

    case Actions.LOAD_POOL:
      window.localStorage.setItem('topic', action.payload.topic);
      return {
        ...state,
        topic: action.payload.topic,
        desc: action.payload.desc,
        current: 0,
        pool: action.payload.pool
      };

    case Actions.FETCH_DOC:
      window.localStorage.setItem('current', action.payload.current);
      return {
        ...state,
        current: action.payload.current,
        doc: action.payload.doc
      };

    case Actions.JUDGE:
      // Update the judgment of the document that was judged
      let update = { judgment: action.payload.judgment };
      if (action.payload.hasOwnProperty('passage')) {
        if (action.payload.passage.hasOwnProperty('clear'))
          update.passage = null;
        else
          update.passage = action.payload.passage;
      }
      if (action.payload.hasOwnProperty('subtopics'))
        update.subtopics = action.payload.subtopics;

      let newPool = state.pool.map((entry) => {
        if (entry.docid === action.payload.docid)
          return { ...entry, ...update };
        else
          return entry;
      });
      return {
        ...state,
        pool: newPool
      };

    case Actions.SAVE_SCAN_TERMS:
      if (action.payload.scan_terms)
        window.localStorage.setItem('scan_terms', action.payload.scan_terms);
      else
        window.localStorage.removeItem('scan_terms');
      return {
        ...state,
        scan_terms: action.payload.scan_terms
      };
    default:
      return state;
  }
};

/* React Contexts allow us to store a value and get it back down deep in
 * the DOM tree, without needing to pass the value all the way down
 * through the properties at each node.
 */
const AssessDispatch = React.createContext(null);

/*
 * A pool item interface component.  Clicking a pool item causes it to
 * load into the document pane.
 */
function PoolItem(props) {
  // Set the relevance 'badge' according to the judgment
  let badge = '';
  if (props.judgment !== '-1') {
    badge = (<Badge variant={rel_levels[props.judgment].color}>
      {rel_levels[props.judgment].label}
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
        return <PoolItem user={props.user} topic={props.topic}
          docid={entry.docid} seq={i} judgment={entry.judgment}
          current={props.current === i}
          fetch_doc={props.fetch_doc} />;
      } else
        return [];
    });
  return (<ListGroup> {entries} </ListGroup>);
}

/* A modal dialog to force logging in.
 * This used to be in App(), but I decided to move it out to a separate
 * component.
 */
function LoginModal(props) {
  const [username, set_username] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState(false);
  const dispatch = useContext(AssessDispatch);

  async function hash(password) {
    const te = new TextEncoder();
    const encoded = te.encode(password.normalize('NFKC'))
    const hashval = await sha256(encoded);
    return hashval;
  }

  function do_login() {
    // Send username and hashed password to the server.
    // Server responds 200 for ok login, 403 for denied
    set_error(false);
    hash(password)
      .then(pwhash => fetch('login?u=' + username + '&p=' + pwhash))
      .then(response => {
        if (response.ok) {
          dispatch({ type: Actions.LOGIN, payload: { username: username } });
          props.set_required(false);
        } else {
          set_error(true);
        }
      });
  }

  return (
    <Modal show={props.login_required} onHide={do_login}
      backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Please log in</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? <p>Invalid username or password.</p> : ''}
        <Form.Control type="text"
          placeholder="user"
          value={username}
          onChange={(e) => set_username(e.target.value)} />
        <Form.Control type="password"
          placeholder="password"
          value={password}
          onChange={(e) => set_password(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              do_login();
            }
          }} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => do_login()}>Log in</Button>
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
        <Modal.Title>
          Select a topic to load
        </Modal.Title>
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
        <Button variant="primary" onClick={() => props.set_show_topic_dialog(false)}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// Render the task/request description
function Description(props) {
  const [show, setShow] = useState(false);

  if (props.desc) {
    const desc = props.desc.topics[0];
    return (
      <div className="border-bottom">
        <span className="h2 mr-5">Request: {props.desc['topic_id']}</span><br />
        <p><b>{desc['topic_title']}</b></p>
        <p>{desc['topic_description']}</p>
        <p>{desc['topic_narrative']}</p>
      </div>
    );
  } else {
    return null;
  }
  // <p style={{whiteSpace: 'pre-wrap'}}>{desc}</p>
}

/*
 * The "app".  The main interface pieces here are a modal for logins, selecting a
 * topic to load, and judgment buttons for judging the currently displayed doc.
 * Wraps the Pool in one subpane and a BetterDocument in the other.  The
 * BetterDocument component handles document rendering.
 */
function App() {
  const [state, dispatch] = useReducer(assess_reducer, initial_state);
  const [login_required, set_login_required] = useState(false);
  const [topic_requested, set_topic_requested] = useState(false);
  const [show_topic_dialog, set_show_topic_dialog] = useState(false);
  const [inbox, set_inbox] = useState({});
  const [scan_terms, set_scan_terms] = useState('');
  const [pool_filter, set_pool_filter] = useState('all');

  /* Effect to fire just before initial render */
  useEffect(() => {
    if (state.username === '') {
      // Try to restore state from the browser's local storage.
      // First check for a username.
      const stored_username = window.localStorage.getItem('user');
      if (stored_username) {
        dispatch({ type: Actions.LOGIN, payload: { username: stored_username } });

        // check for scan terms
        const scan_terms = window.localStorage.getItem('scan_terms');
        if (scan_terms) {
          dispatch({ type: Actions.SAVE_SCAN_TERMS, payload: { scan_terms: scan_terms } });
          set_scan_terms(scan_terms);
        };

        // Then, check for last topic loaded
        const cur_topic = window.localStorage.getItem('topic');
        if (cur_topic) {
          // And last document viewed?  If not just set to 0
          let cur_doc = window.localStorage.getItem('current');
          if (cur_doc)
            cur_doc = parseInt(cur_doc);
          else
            cur_doc = 0;
          load_pool(stored_username, cur_topic, cur_doc);
        }
      } else {
        set_login_required(true);
      }
    }
  }, [state.username]);

  /* Load the "inbox", the list of topics to do and how much has been done. */
  function load_inbox(username) {
    fetch('inbox?u=' + state.username)
      .then(response => response.json())
      .then(data => set_inbox(data));
  }

  /* If someone clicks "Load topic", we need to refresh the inbox and
   * put up the load-topic dialog. */
  useEffect(() => {
    if (topic_requested && state.username !== '') {
      load_inbox(state.username);
      set_topic_requested(false);
      set_show_topic_dialog(true);
    }
  }, [topic_requested]);

  function load_pool(username, topic, current = 0) {
    fetch('pool?u=' + username + '&t=' + topic)
      .then(response => response.json())
      .then(data => {
        if (data.last)
          current = data.last;
        const desc_obj = JSON.parse(data.desc);
        dispatch({
          type: Actions.LOAD_POOL, payload: {
            topic: topic,
            pool: data.pool,
            desc: desc_obj
          }
        });
        return fetch('doc?u=' + username
          + '&t=' + topic
          + '&d=' + data.pool[current].docid);
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(data => {
        dispatch({
          type: Actions.FETCH_DOC, payload: {
            doc: data,
            current: current
          }
        });
        set_show_topic_dialog(false);
      });
  }

  function load_pool_for_current_user(topic, current = 0) {
    load_pool(state.username, topic, current);
  }

  function load_pool_item(i) {
    if (i < 0 || i >= state.pool.length) return;

    const docid = state.pool[i].docid
    fetch('doc?t=' + state.topic
      + '&u=' + state.username
      + '&d=' + docid)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return '';
      })
      .then(data => {
        dispatch({
          type: Actions.FETCH_DOC,
          payload: {
            current: i,
            doc: data
          }
        });
      });
  }

  function judge_current({
    judgment = '0',
    passage = null,
    subtopics = {},
  }) {
    const docid = state.pool[state.current].docid;

    if (passage && (judgment === '0' || judgment === '-1'))
      judgment = '2';

    if (judgment === '0') {
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

    fetch('judge?u=' + state.username +
      '&t=' + state.topic +
      '&d=' + docid, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(judge_payload)
    })
      .then(response => {
        if (response.ok)
          dispatch({ type: Actions.JUDGE, payload: judge_payload });
      });
  }

  function note_passage(passage) {
    let judgment = state.pool[state.current].judgment;
    if (judgment === '-1' || judgment === '0')
      judgment = '2';
    judge_current({ judgment: judgment, passage: passage });
  }

  function note_subtopic(subchecks) {
    let judgment = state.pool[state.current].judgment;

    if (Object.values(subchecks).some(x => x === true)) {
      if (judgment === '-1' || judgment === '0') {
        judgment = '1';
      }
    }
    judge_current({ judgment: judgment, subtopics: subchecks });
  }

  /*
   * The judgment buttons are colored according to the key at the top,
   * and the judgment for the currently selected document is bolded.
   */
  const judgment_buttons = Object.getOwnPropertyNames(rel_levels).map((i) => {
    let style = 'font-weight-normal';
    if (state.current >= 0 &&
      state.current < state.pool.length
      && i === state.pool[state.current].judgment) {
      style = 'font-weight-bold';
    }
    return (
      <ButtonGroup>
        <Button variant={rel_levels[i].color}
          onClick={() => judge_current({ judgment: i })}>
          <span className={style}>
            {rel_levels[i].label}
          </span>
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
      case '0':
      case '1':
      case '2':
      case '3':
        judge_current({ judgment: event.key });
        break;
      case 'n':
        load_pool_item(state.current + 1);
        break;
      case 'p':
        load_pool_item(state.current - 1);
        break;
    }
  };

  useKeyPress(['n', 'p', '0', '1', '2', '3'], onKeyPress);

  const docDiv = useRef(null);

  // When the document is updated, scroll to the top.
  useEffect(() => {
    if (docDiv.current) {
      docDiv.current.scrollTo(0, 0);
    }
  }, [state.doc])

  return (
    <AssessDispatch.Provider value={dispatch}>
      <Container fluid className="d-flex flex-column min-vh-100 overflow-hidden">

        { /************** Modals */}
        <LoginModal login_required={login_required} set_required={set_login_required} />
        <LoadTopicModal show_topic_dialog={show_topic_dialog}
          set_show_topic_dialog={set_show_topic_dialog}
          inbox={inbox}
          load_pool={load_pool_for_current_user} />

        { /************** Header line: load pool, filter pool, judgment buttons, logout button */}
        <Row xs={12} className="fixed-top align-items-center flex-shrink-0">
          <Col xs="auto" className="flex-row flex-shrink-0 mx-3">
            <FontAwesomeIcon icon={faCoffee} /> <span className="navbar-brand">Assess</span>
          </Col>
          <Col xs="auto" className="flex-shrink-1">
            <Button variant="primary"
              onClick={() => set_topic_requested(true)}>Load Pool</Button>
          </Col>
          <Col xs="auto">
            {state.current + 1} of {state.pool.length}
          </Col>
          <Col xs="auto">
            <Form.Control as="select" onChange={(e) => set_pool_filter(e.target.value)}>
              <option>all</option>
              <option>unjudged</option>
              {Object.getOwnPropertyNames(rel_levels).map((i) =>
                <option value={i}>{rel_levels[i].label}</option>)}
            </Form.Control>
          </Col>
          <Col xs="auto" className="mr-auto">
            {judgment_buttons}
          </Col>
          <Col xs="auto" className="mx-3">
            <Button onClick={() => dispatch({ type: Actions.LOGOUT })}>Log out {state.username}</Button>
          </Col>
        </Row>

        { /************** Scanterms */}
        <Row className="mt-5 pt-2"> </Row>
        <Col>
          <Form inline>
            <Form.Control placeholder="Scan terms" className="col-10 mx-3"
              dir={(state.doc && state.doc['lang'] === 'fas') ? "rtl" : ""}
              value={scan_terms}
              onChange={(e) => set_scan_terms(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch({
                    type: Actions.SAVE_SCAN_TERMS,
                    payload: { scan_terms: scan_terms }
                  });
                }
              }} />
            <Button variant="primary"
              onClick={() => {
                dispatch({
                  type: Actions.SAVE_SCAN_TERMS,
                  payload: { scan_terms: scan_terms }
                });
              }}>Apply</Button>
            <Button variant="secondary"
              onClick={() => {
                set_scan_terms('');
                dispatch({
                  type: Actions.SAVE_SCAN_TERMS,
                  payload: { scan_terms: null }
                });
              }}>Clear</Button>
          </Form>
        </Col>

        { /************** Main: pool column and topic/document column */}
        <Row className="mt-3 vh-full">
          <Col xs={4} className="vh-full overflow-auto">
            <Pool user={state.username} topic={state.topic}
              pool={state.pool} current={state.current} filter={pool_filter}
              fetch_doc={load_pool_item}
            />
          </Col>
          <Col ref={docDiv} xs={8} className="vh-full overflow-auto">
            <Description desc={state.desc}
              note_subtopic={note_subtopic}
              rel={(state.current >= 0 && state.pool[state.current].subtopics)
                ? state.pool[state.current].subtopics : null} />
            <Highlightable content={state.doc} scan_terms={state.scan_terms}
              rel={(state.current >= 0 && state.pool[state.current].passage)
                ? state.pool[state.current].passage : ''}
              note_passage={note_passage} />
          </Col>
        </Row>
      </Container>
    </AssessDispatch.Provider>
  );
}

export default App;

