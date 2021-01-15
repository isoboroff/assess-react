import React, { useState, useEffect } from 'react';

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

const useDocApi = (username) => {
  const [doc, setDoc] = useState('');
  const [docid, setDocid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);
      const url = 'doc?u=' + username + '&d=' + docid;
      
      try {
        const response = await fetch(url);
        const content = await response.json();
        setDoc(content);
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    if (username)
      fetchData();
  }, /* depends on */ [docid]);

  return [{ doc, isLoading, isError }, setDocid];
};

const usePoolApi = (username, initTopic) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [topic, setTopic] = useState(initTopic);
  const [pool, setPool] = useState([]);
  const [judgment, setJudgment] = useState({});

  // Pool load effect
  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);
      const url = 'pool?u=' + username + '&t=' + topic;
      try {
        const response = await fetch(url);
        const data = await response.json();
        setPool(data.pool);
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    if (username)
      fetchData();
  }, /* depends on */ [topic]);

  // Document judgement effect
  useEffect(() => {
    const sendJudgment = async () => {
      setIsError(false);
      setIsLoading(true);
      const url = 'judge?u=' + username
            + '&t=' + topic
            + '&d=' + pool[judgment.index].docid
            + '&j=' + judgment.level;
      try {
        const response = await fetch(url, { method: 'POST' });
        if (await response.ok) {
          let newPool = pool.map((item, i) => {
            if (judgment.index === i) {
              return { ...item, judgment: judgment.level };
            } else {
              return item;
            }
          });
          setPool(newPool);
        }
      } catch (error) {
        setIsError(true);
      }
      setIsLoading(false);
    };

    if (judgment && judgment.index > 0 && judgment.index < pool.length)
      sendJudgment();
  }, /* depends on */ [judgment]);

  return [{ pool, isLoading, isError }, setTopic, setJudgment];
};

function PoolItem(props) {
  let badge = '';
  if (props.judgment !== '-1') {
    badge = (<Badge variant={rel_levels[props.judgment].color}>
               {rel_levels[props.judgment].label}
             </Badge>);
  }
  const do_fetch_and_set = (docid, index) => {
    props.fetchDoc(docid);
    props.setCurrent(index);
  };
  
  return (
    <ListGroup.Item action
                    active={props.current}
                    onClick={() => do_fetch_and_set(props.docid, props.seq)}>
      {props.seq}: {props.docid} {badge}
    </ListGroup.Item>
  );
}

function Pool(props) {
  const entries =  props.pool.map((entry, i) => (
    <PoolItem docid={entry.docid} seq={i} judgment={entry.judgment}
              current={props.current === i}
              fetchDoc={props.fetchDoc} setCurrent={props.setCurrent}/>
  ));
  return (<ListGroup> {entries} </ListGroup>);
}

function App() {
  const [username, set_username] = useState('');
  const [login_required, set_login_required] = useState(true);
  const [topic, set_topic] = useState(-1);
  const [current, set_current] = useState(-1);
  const [{ pool, poolIsLoading, poolError }, load_pool, do_judge] = usePoolApi(username, -1);
  const [{ doc, docIsLoading, docIsError}, fetch_doc] = useDocApi(username);

  const do_login = () => {
    if (username !== null)
      set_login_required(false);
  };

  const judge_current = (level) => {
    do_judge({index: current, level: level});
  };

  const judgment_buttons = Object.getOwnPropertyNames(rel_levels).map((i) => {
    let style = 'font-weight-normal';
    if (current >= 0 && current < pool.length && i === pool[current].judgment) {
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
    <Container fluid className='overflow-hidden'>
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
                              load_pool(topic);
                            }}}/>
            <Button variant="primary" onClick={() => load_pool(topic)}>Load</Button>
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

      <Container fluid className='mx-3 mt-5 h-100 overflow-hidden'>
        <Row className='mt-5 vh-100 overflow-hidden'>
          <Col xs={4} className='vh-100 overflow-auto'>
            <Pool pool={pool} current={current} fetchDoc={fetch_doc} setCurrent={set_current}/>
          </Col>
          <Col className='vh-100 mr-3 overflow-auto'>
            <BetterDocument content={doc} loading={docIsLoading} error={docIsError}/>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default App;
