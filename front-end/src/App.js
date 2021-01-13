import React, { useState } from 'react';

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

const rel_levels = {'0': {label: 'irrelevant',  color: 'secondary'},
                    '1': {label: 'topical',     color: 'info'},
                    '2': {label: 'significant', color: 'primary'},
                    '3': {label: 'decisional',  color: 'success'},
                    '4': {label: 'DECISIVE',    color: 'danger'}};

function PoolItem(props) {
  const load_doc = (docid, seq) => {
    const url = 'doc?u=foo&d=' + docid;
    fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw Error(response.statusText);
        }
      }).then((data) => {
        // put the document data where it should go.
        props.setDoc(data);
        props.setCurrent(seq);
      });
  };

  let badge = '';
  if (props.judgment !== '-1') {
    badge = (<Badge variant={rel_levels[props.judgment].color}>
               {rel_levels[props.judgment].label}
             </Badge>);
  }
  return (
    <ListGroup.Item action
                    active={props.current}
                    onClick={() => load_doc(props.docid, props.seq)}>
      {props.seq}: {props.docid} {badge}
    </ListGroup.Item>
  );
}

function Pool(props) {
  const entries =  props.pool.map((entry, i) => (
    <PoolItem docid={entry.docid} seq={i} judgment={entry.judgment}
              current={props.current === i}
              setDoc={props.setDoc} setCurrent={props.setCurrent}/>
  ));
  return (<ListGroup> {entries} </ListGroup>);
}

function App() {
  const [username, set_username] = useState('');
  const [login_required, set_login_required] = useState(true);
  const [topic, set_topic] = useState(-1);
  const [current, set_current] = useState(-1);
  const [pool, set_pool] = useState([]);
  const [doc, set_doc] = useState('');

  const do_login = () => {
    if (username !== null)
      set_login_required(false);
  };

  const load_topic = () => {
    if (username === null)
      return;

    const url = 'pool?u=' + username + '&t=' + topic;
    fetch(url)
      .then((response) => {
	if (response.ok) {
	  return response.json();
	} else {
	  throw Error(response.statusText);
	}
      }).then((data) => {
        set_topic(data.topic);
        set_current(0);
        set_pool(data.pool);
      });
  };

  const set_judgment = (index, level) => {
    let newPool = pool.map((item, i) => {
      if (index === i) {
        return { ...item, judgment: level };
      } else {
        return item;
      }
    });
    set_pool(newPool);
  };                      
  
  const judge_current = (level) => {
    set_judgment(current, level);
    // Oh and send something back to the server willya?
  };

  const judgment_buttons = Object.getOwnPropertyNames(rel_levels).map((i) => (
    <ListGroup.Item action
                    variant={rel_levels[i].color}
                    onClick={() => judge_current(i)}>
      {rel_levels[i].label}
    </ListGroup.Item>
  ));

  return (
    <>
      <Modal show={login_required} onHide={do_login}
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
          <Button variant="primary" onClick={do_login}>Log in</Button>
        </Modal.Footer>
      </Modal>

      <Navbar fixed="top" className="bg-light">
        <div className="">
          <Form inline>
            <Form.Control placeholder="Topic" className="col-3"
                          value={topic}
                          onChange={(e) => set_topic(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              load_topic();
                            }}}/>
            <Button variant="primary" onClick={load_topic}>Load</Button>
            <div className="p-2">
              {username} &nbsp; {current + 1} of {pool.length}
            </div>
          </Form>		  
        </div>
        <div>
          <ListGroup horizontal>
            {judgment_buttons}
          </ListGroup>
        </div>
      </Navbar>

      <Container className='mx-3 mt-5'>
        <Row className='mt-5'>
          <Col xs={4} style={{overflowY: 'scroll'}}>
            <Pool pool={pool} current={current} setDoc={set_doc} setCurrent={set_current}/>
          </Col>
          <Col>
            <BetterDocument content={doc}/>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
