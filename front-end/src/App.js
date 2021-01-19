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

const initial_state = {
  username: '',
  current: -1,
  cur_doc: '',
  topic: '',
  pool: []
};

const States = Object.freeze({
  LOGIN: 'LOGIN',
  LOAD_POOL: 'LOAD_POOL',
  FETCH_DOC: 'FETCH_DOC',
  JUDGE: 'JUDGE',
});
  
function assess_reducer(state, action) {
  switch (action.type) {
  case States.LOGIN:
    return {...state,
            username: action.payload.username};
  case States.LOAD_POOL:
    return {...state,
            topic: action.payload.topic,
            current: 0,
            pool: action.payload.pool};
  case States.FETCH_DOC:
    return {...state,
            current: action.payload.current,
            doc: action.payload.doc};
  case States.JUDGE:
    const newPool = state.pool.map((entry) => {
      if (entry.docid === action.payload.docid)
        return {...entry,
                level: action.payload.level};
      else
        return entry;
    });
    return {...state,
            pool: newPool};
  default:
    return state;
  }
};



const AssessDispatch = React.createContext(null);

/*
 * A pool item interface component.  Clicking a pool item causes it to
 * load into the document pane.  The component isn't really that complex,
 * but the relevance indicators make this worth packing into its own
 * component function.
 */
function PoolItem(props) {
  let badge = '';
  if (props.judgment !== '-1') {
    badge = (<Badge variant={rel_levels[props.judgment].color}>
               {rel_levels[props.judgment].label}
             </Badge>);
  }
  const dispatch = useContext(AssessDispatch);
  function fetch_doc(seq, docid) {
    fetch('doc?d=' + docid)
      .then(response => response.json())
      .then(data => {
        dispatch({ type: States.FETCH_DOC,
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

function LoginModal(props) {
  const [username, set_username] = useState('');
  const dispatch = useContext(AssessDispatch);

  function do_login() {
    dispatch({type: States.LOGIN, payload: {username: username}});
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
  const [load_pool, set_load_pool] = useState(false);

  /* Effect to fire just before initial render */
  useEffect(() => {
    if (state.username === '')
      set_login_required(true);
  }, []);

  useEffect(() => {
    if (!load_pool)
      return;
    
    fetch('pool?u=' + state.username + '&t=' + topic_entry)
      .then(response => response.json())
      .then(data => {
        dispatch({ type: States.LOAD_POOL, payload: { topic: topic_entry,
                                                      pool: data.pool}});
        set_load_pool(false);
      });
  }, [load_pool, topic_entry]);
  
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
                      onClick={() => console.log('judge_current('+i+')')}>
        <span className={style}>
          {rel_levels[i].label}
        </span>
      </ListGroup.Item>
    );
  });
  
  return (
    <AssessDispatch.Provider value={dispatch}>
      <Container fluid className='overflow-hidden'>
        
        <LoginModal login_required={login_required} set_required={set_login_required}/>

        <Navbar fixed="top" className="bg-light">
          <div className="">
            <Form inline>
              <Form.Control placeholder="Topic" className="col-3"
                            value={topic_entry}
                            onChange={(e) => set_topic_entry(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                set_load_pool(true);
                              }}}/>
              <Button variant="primary"
                      onClick={() => set_load_pool(true)}>Load</Button>
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

        <Container fluid className='mx-3 mt-5 h-100 overflow-hidden'>
          <Row className='mt-5 vh-100 overflow-hidden'>
            <Col xs={4} className='vh-100 overflow-auto'>
              <Pool pool={state.pool} current={state.current}/>
            </Col>
            <Col className='vh-100 mr-3 overflow-auto'>
              <BetterDocument content={state.doc}/>
            </Col>
          </Row>
        </Container>
      </Container>
    </AssessDispatch.Provider>
  );
}

export default App;
