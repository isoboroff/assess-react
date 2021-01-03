import React, { useState } from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [username, set_username] = useState('');
  const [login_required, set_login_required] = useState(true);
  const [topic, set_topic] = useState(-1);
  const [current, set_current] = useState(-1);
  const [pool, set_pool] = useState([]);

  const do_login = () => {
    if (username !== null)
      set_login_required(false);
  };

  const load_topic = () => {
    console.log('load_topic');
  };
  
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
      </Navbar>
      
      <Row className="mx-5 mt-5">
        <Col style={{overflowY: 'scroll'}}>
          <p> This is the pool view </p>
        </Col>
        <Col>
          <p> This is the document view</p>
        </Col>
      </Row>
    </>
  );
}

export default App;
