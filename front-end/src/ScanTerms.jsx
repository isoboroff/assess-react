import * as React from "react";
import { AssessDispatch } from "./Contexts";
import { Col, Form, Row, Button } from "react-bootstrap";
import { Actions } from "./App";
import PropTypes from "prop-types";

export default function ScanTerms(props) {
  const dispatch = React.useContext(AssessDispatch);
  const change = React.useCallback((e) => {
    props.set_scan_terms(e.target.value);
    e.preventDefault();
    e.stopPropagation();
  }, [props]);
  
  const update = React.useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dispatch({
        type: Actions.SAVE_SCAN_TERMS,
        payload: { scan_terms: props.scan_terms },
      });
    }
    e.stopPropagation();
  }, [props, dispatch]);

  const apply = React.useCallback(() => {
    dispatch({
      type: Actions.SAVE_SCAN_TERMS,
      payload: { scan_terms: props.scan_terms },
    });
  }, [props, dispatch]);

  const clear = React.useCallback(() => {
    props.set_scan_terms("");
    dispatch({
      type: Actions.SAVE_SCAN_TERMS,
      payload: { scan_terms: null },
    });
  }, [props, dispatch]);

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

ScanTerms.propTypes = {
  scan_terms: PropTypes.string,
  set_scan_terms: PropTypes.func,
  dir: PropTypes.string,
};
