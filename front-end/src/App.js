import React, { useState, useEffect, useReducer, useContext } from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';

import BetterDocument from './BetterDocument';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

/* Mapping relevance levels to labels to colors in the interface */
const rel_levels = {'0': {label: 'irrelevant',  color: 'secondary'},
                    '1': {label: 'topical',     color: 'info'},
                    '2': {label: 'significant', color: 'primary'},
                    '3': {label: 'decisional',  color: 'success'},
                    '4': {label: 'DECISIVE',    color: 'danger'}};

/* This is the application state. */
const initial_state = {
  username: '',
  current: -1,
  cur_doc: '',
  topic: '',
  pool: []
};

/* These are actions which change the application state. */
const Actions = Object.freeze({
  LOGIN: 'LOGIN',
  LOAD_POOL: 'LOAD_POOL',
  FETCH_DOC: 'FETCH_DOC',
  JUDGE: 'JUDGE',
});

/* And this function, called a "reducer", updates the application state
 * appropriately for each action
 */
function assess_reducer(state, action) {
  switch (action.type) {
  case Actions.LOGIN:
    window.localStorage.setItem('user', action.payload.username);
    return {...state,
            username: action.payload.username};
    
  case Actions.LOAD_POOL:
    window.localStorage.setItem('topic', action.payload.topic);
    return {...state,
            topic: action.payload.topic,
            desc: action.payload.desc,
            current: 0,
            pool: action.payload.pool};
    
  case Actions.FETCH_DOC:
    window.localStorage.setItem('current', action.payload.current);
    return {...state,
            current: action.payload.current,
            doc: action.payload.doc};
    
  case Actions.JUDGE:
    // Update the judgment of the document that was judged
    const newPool = state.pool.map((entry) => {
      if (entry.docid === action.payload.docid)
        return {...entry,
                judgment: action.payload.judgment};
      else
        return entry;
    });
    return {...state,
            pool: newPool};
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

  // This function fetches the document and updates the application state.
  const dispatch = useContext(AssessDispatch);
  function fetch_doc(seq, docid) {
    fetch('doc?d=' + docid)
      .then(response => response.json())
      .then(data => {
        dispatch({ type: Actions.FETCH_DOC,
                   payload: { current: seq,
                              doc: data }});
      });
  }

  return (
    <ListGroup.Item action
                    active={props.current}
                    onClick={() => fetch_doc(props.seq, props.docid)}>
      {props.seq + 1}: {props.docid} {badge}
    </ListGroup.Item>
  );
}

/*
 * The pool component.  This basically renders the pool itself into pool items.
 */
function Pool(props) {
  const entries =  props.pool.map((entry, i) => (
    <PoolItem docid={entry.docid} seq={i} judgment={entry.judgment}
              current={props.current === i}/>
  ));
  return (<ListGroup> {entries} </ListGroup>);
}

/* A modal dialog to force logging in.
 * This used to be in App(), but I decided to move it out to a separate
 * component.
 */
function LoginModal(props) {
  const [username, set_username] = useState('');
  const dispatch = useContext(AssessDispatch);

  function do_login() {
    dispatch({type: Actions.LOGIN, payload: {username: username}});
    props.set_required(false);
  }
  
  return (
    <Modal show={props.login_required} onHide={do_login}
           backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Please log in</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control type="text"
                      placeholder="user"
                      value={username}
                      onChange={(e) => set_username(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          do_login();
                        }}}/>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => do_login()}>Log in</Button>
      </Modal.Footer>
    </Modal>
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
  const [login_required, set_login_required] = useState(false);
  const [topic_entry, set_topic_entry] = useState('');

  /* Effect to fire just before initial render */
  useEffect(() => {
    if (state.username === '') {
      // Try to restore state from the browser's local storage.
      // First check for a username.
      const stored_username = window.localStorage.getItem('user');
      if (stored_username) {
        dispatch({ type: Actions.LOGIN, payload: { username: stored_username }});

        // Then, check for last topic loaded
        const cur_topic = window.localStorage.getItem('topic');
        if (cur_topic) {
          set_topic_entry(cur_topic);
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
  }, []);

  function load_pool(username, topic, current = 0) {
    fetch('pool?u=' + username + '&t=' + topic)
      .then(response => response.json())
      .then(data => {
        dispatch({ type: Actions.LOAD_POOL, payload: {topic: topic,
                                                      pool: data.pool,
                                                      desc: data.desc}});
        return fetch('doc?d=' + data.pool[current].docid);
      }).then(response => response.json())
      .then(data => {
        dispatch({ type: Actions.FETCH_DOC, payload: {doc: data,
                                                      current: current}});
      });
  }    
  
  function judge_current(judgment) {
    const docid = state.pool[state.current].docid;
    fetch('judge?u=' + state.username +
          '&t=' + state.topic +
          '&d=' + docid +
          '&j=' + judgment, { method: 'POST' })
      .then(response => {
        if (response.ok)
          dispatch({ type: Actions.JUDGE, payload: { docid: docid, judgment: judgment }});
      });
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
      <ListGroup.Item action
                      variant={rel_levels[i].color}
                      onClick={() => judge_current(i)}>
        <span className={style}>
          {rel_levels[i].label}
        </span>
      </ListGroup.Item>
    );
  });
  
  return (
    <AssessDispatch.Provider value={dispatch}>
      <Container fluid className='calc-height d-flex flex-column'>
        
        <LoginModal login_required={login_required} set_required={set_login_required}/>

        <Navbar fixed="top" className="bg-light flex-shrink-0">
          <div className="">
            <Form inline>
              <Form.Control placeholder="Topic" className="col-3"
                            value={topic_entry}
                            onChange={(e) => set_topic_entry(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                load_pool(state.username, topic_entry);
                              }}}/>
              <Button variant="primary"
                      onClick={() => load_pool(state.username, topic_entry)}>Load</Button>
              <div className="p-2">
                {state.username} &nbsp; {state.current + 1} of {state.pool.length}
              </div>
            </Form>		  
          </div>
          <div>
            <ListGroup horizontal>
              {judgment_buttons}
            </ListGroup>
          </div>
        </Navbar>

        <Row className='mt-5 justify-content-center'>
          <Col xs={8}>
            <p style={{whiteSpace: "pre-wrap"}}>{state.desc}</p>
          </Col>
        </Row>
        <Row className='flex-grow-1'>
          <Col xs={4} className='overflow-auto vh-100'>
            <Pool pool={state.pool} current={state.current}/>
          </Col>
          <Col className='mr-3 overflow-auto vh-100'>
            <BetterDocument content={state.doc}/>
          </Col>
        </Row>
      </Container>
    </AssessDispatch.Provider>
  );
}

export default App;
