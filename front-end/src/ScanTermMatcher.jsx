import { Matcher } from 'interweave';


export default class ScanTermMatcher extends Matcher {
  constructor(name, options, factory) {
    super(name, { scan_terms: '', ...options }, factory);
  }

  replaceWith(children, props) {
    return <span className="scan-term" {...props}>{children}</span>;
  }

  asTag() {
    return 'span';
  }

  match(string) {
    if (this.options.scan_terms) {
      const sterm_re = RegExp(this.options.scan_terms.trim().replace(/\s+/g, '|'), 'i');
      return this.doMatch(string, sterm_re, (matches) => ({ extraProp: 'foo' }));
    } else {
      return null;
    }
  }
}
