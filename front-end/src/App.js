import React, { useState } from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';

import BetterDocument from './BetterDocument';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [username, set_username] = useState('');
  const [login_required, set_login_required] = useState(true);
  const [topic, set_topic] = useState(-1);
  const [current, set_current] = useState(-1);
  const [pool, set_pool] = useState([]);
  const [doc, set_doc] = useState('');

  const btn_labels = [['0', 'irrelevant'],
                      ['1', 'topical'],
                      ['2', 'significant'],
                      ['3', 'decisional'],
                      ['4', 'DECISIVE']];
  
  const color_mapping = [['0', 'secondary'],
                         ['1', 'info'],
                         ['2', 'primary'],
                         ['3', 'success'],
                         ['4', 'danger']];
  const rel_colors = new Map(color_mapping);
  
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

  const load_doc = (docid, i) => {
    if (username === null)
      return;

    const url = 'doc?u=' + username + '&d=' + docid;
    fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw Error(response.statusText);
        }
      }).then((data) => {
        // put the document data where it should go.
        set_doc(data);
        set_current(i);
      });
  };

  const judge_current = (level) => {
    pool[current].judgment = level;
    // Oh and send something back to the server willya?
  };

  const judgment_buttons = btn_labels.map((entry) => (
    <ListGroup.Item action
                    variant={rel_colors.get(entry[0])}
                    onClick={() => judge_current(entry[0])}>
      {entry[1]}
    </ListGroup.Item>
  ));

  const pool_list = pool.map((entry, i) => (
    <ListGroup.Item action
                    active={current === i}
                    variant={rel_colors.get(entry.judgment) || null}
                    onClick={() => load_doc(entry.docid, i)}>
      {entry.docid}: {entry.judgment}
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
            <ListGroup>
              { pool_list }
            </ListGroup>
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
