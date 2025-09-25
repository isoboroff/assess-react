import json
import secrets
import re
import time
import os
from pathlib import Path

from flask import Flask, abort, redirect, render_template, render_template_string, request, jsonify, session, url_for
from elasticsearch import Elasticsearch
from webargs import fields, validate
from webargs.flaskparser import use_args
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from user import User


app = Flask(__name__, 
            static_folder='../front-end/dist', 
            static_url_path='/',
            template_folder='../front-end/dist')

app.config.from_pyfile('settings.py')
app.config.update({'SECRET_KEY': secrets.token_hex()})
if 'LOGLEVEL' in app.config:
    app.logger.setLevel(app.config['LOGLEVEL'])

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(id):
    return User.get(id)

#ELASTIC_PW = 'xWdaVo-josy6fjE*TS9e'
es = Elasticsearch(
    f'http://{app.config["ELASTIC_HOST"]}:{app.config["ELASTIC_PORT"]}',
#    http_auth=('elastic', ELASTIC_PW),
    retry_on_timeout=True,
    max_retries=10,
    request_timeout=30)

Path(app.config['SAVE']).mkdir(exist_ok=True)

if 'TZ' in app.config:
    os.environ['TZ'] = app.config['TZ']
    time.tzset()

class Pool:
    '''This pool reads standard TREC mastermerge pools, but the
    logs are JSON lines.
    '''
    def __init__(self, filename):
        self.pool = {}
        self.topic = None
        self.desc = ''
        self.last = ''
        self.last_stamp = 0

        with open(filename, 'r') as fp:
            for line in fp:
                fields = line.split()
                if not self.topic:
                    self.topic = fields[0]
                if fields[0] != self.topic:
                    continue
                self.pool[fields[1]] = { 'judgment': '-1' }

        try:
            with open(f'{filename}.log', 'r') as log:
                for line in log:
                    log_entry = Pool.read_log_entry(line)
                    self.last = log_entry['docid']
                    self.last_stamp = log_entry['stamp']
                    if 'passage' in log_entry:
                        self.pool[log_entry['docid']]['passage'] = log_entry['passage']
                    if 'judgment' in log_entry:
                        self.pool[log_entry['docid']]['judgment'] = log_entry['judgment']
                    if 'subtopics' in log_entry:
                        if 'subtopics' not in self.pool[log_entry['docid']]:
                            self.pool[log_entry['docid']]['subtopics'] = {}
                        for subtopic, value in log_entry['subtopics'].items():
                            self.pool[log_entry['docid']]['subtopics'][subtopic] = value

        except FileNotFoundError:
            pass
        except KeyError:
            app.logger.debug('Bad log entry ' + self.topic + ': ' + log_entry)
            pass
        try:
            with open(f'{filename}.md', 'r') as fp:
                text = fp.read()
                self.desc = json.dumps({ "id": self.topic, "query": text })
        except FileNotFoundError:
            self.desc = json.dumps({'text': 'No description file'})

    def __len__(self):
        return len(self.pool)

    def num_rel(self):
        rels = set(['S1','S2','C1','C2'])
        return sum([1 for judgment in self.pool.values() if judgment['judgment'] in rels])

    def num_judged(self):
        return sum([1 for judgment in self.pool.values() if judgment['judgment'] != '-1'])

    def as_object(self):
        poollist = []
        last = 0
        count = 0
        for docid, jobj in self.pool.items():
            if docid == self.last:
                last = count
            poolitem = {'docid': docid,
                        'judgment': jobj['judgment']}
            if 'passage' in jobj:
                poolitem['passage'] = jobj['passage']
            if 'subtopics' in jobj:
                poolitem['subtopics'] = jobj['subtopics']

            poollist.append(poolitem)
            count += 1
        return { "pool": poollist,
                 "topic": self.topic,
                 "desc": self.desc,
                 "last": last }

    def json(self):
        return json.dumps(self.as_object())

    @staticmethod
    def read_log_entry(line):
        if line.startswith('#'):
            return None
        log_entry = json.loads(line)
        if 'stamp' not in log_entry or 'docid' not in log_entry:
            app.logger.debug('Bad log object: ' + json.dumps(log_entry))
            return None
        return log_entry

#query_args = {
#    'p': fields.String(validate=validate.Length(equal=64)),
#    't': fields.String(validate=validate.Regexp(r'^[0-9a-z.]+$')),
#    'd': fields.String(),
#    'i': fields.String(validate=validate.OneOf(['ragtime', 'ragtime-mt']))
#}
topic_regex = r'^PSRT_Recs_\d{3}$'
indexes = ['product-md']
docid_regex = r'[A-Z0-9]+'

# This function decrypts a message using the app's private key
# Source: https://elc.github.io/python-security/chapters/07_Asymmetric_Encryption.html
# In this skeleton, this is used to decrypt the username stored in the flask session
def app_decrypt(message):
    password = app.config.get('PRIVATE_KEY_PASSWORD', None)
    if not password:
        password = os.getenv('PRIVATE_KEY_PASSWORD')
    key_pem = Path(app.config['PRIVATE_KEY_FILE']).read_bytes()
    try:
        key = serialization.load_pem_private_key(
            key_pem,
            password=password
        )
    except ValueError:
        raise ValueError('Error loading private key')
    try:
        decrypted = key.decrypt(message,
                                padding.OAEP(
                                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                                    algorithm=hashes.SHA256(),
                                    label=None)
        )
    except ValueError:
        raise ValueError('Decryption failed')
    return decrypted

@app.route('/')
# @login_required
def index():
    if not current_user.is_authenticated:
        if len(session) == 0:
            app.logger.debug('index(): session looks empty')
        return login_manager.unauthorized()
    # This sends the index.html from the compiled front-end
    print(f'session username is {session["username"]}')
    template = open(Path(app.static_folder) / 'index.html', 'r').read()
    return render_template_string(template, username=current_user.email)

@app.route('/login')
@use_args({"u": fields.Str(),
           }, location="query")
def login(args):
    if app.debug:
        username = 'ian.soboroff@nist.gov'
        user = User.get(username)
        if user:
            login_user(user)
            session['username'] = user.id
            return redirect(url_for('index'))
        else:
            abort(401)

    # The username is put into the session by the login.gov proxy
    try:
        encrypted_username = bytes.fromhex(args['u'])
        app.logger.debug(f'Got enc username {encrypted_username}')
    except KeyError:
        return redirect(app.config['LOGIN_PROXY_URL'])

    try:
        username = app_decrypt(encrypted_username).decode('utf-8')
        app.logger.debug(f'Decrypted; {username}')
    except ValueError as e:
        app.logger.warning(f'Login decrypt fail: {e}')
        return redirect(app.config['LOGIN_PROXY_URL'])

    user = User.get(username)

    if user:
        app.logger.debug(f'User is {user.id}')
        login_user(user)
        return redirect(url_for('index'))
    else:
        app.logger.debug(f'No such user {username}')
        return redirect(app.config['LOGIN_PROXY_URL'])

@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(app.config['LOGIN_PROXY_URL'])

@app.route('/dashboard')
@login_required
def dashboard_front():
    return render_template('index.html')

POOL_FILE_RE = re.compile(r'^topicPSRT_Recs_\d{3}$')

@app.route('/inbox')
@login_required
def inbox():
    user = current_user.id
    data = {}
    try:
        homedir = Path(app.config['SAVE']) / user
        for child in homedir.iterdir():
            if POOL_FILE_RE.match(child.name):
                p = Pool(child)
                data[p.topic] = (len(p), p.num_judged(), p.num_rel())

        app.logger.debug('Got inbox for ' + user)
        return(data, 200)
    except IOError as e:
        app.logger.exception('I/O error reading for ' + user)
        app.logger.exception(e.strerror + ': ' + e.filename)
        return('', 503)
    except Exception:
        app.logger.exception('Unexpected error reading for ' + user)
        return('', 503)

@app.route('/dashdata')
@login_required
def dashboard():
    data = []
    try:
        reldir = Path(app.config['SAVE'])
        for relchild in reldir.iterdir():
            if relchild.is_dir():
                if relchild.is_symlink() or (relchild / 'no-dashboard').exists():
                    continue
                for child in relchild.iterdir():
                    if POOL_FILE_RE.match(child.name):
                        p = Pool(child)
                        num_valuable = sum([1 for judgment in p.pool.values() if int(judgment['judgment']) > 1])
                        pct_rel = num_valuable * 100 / len(p)
                        data.append({'topic': p.topic,
                                     'assr': child.parent.stem,
                                     'num_docs': len(p),
                                     'num_rel': num_valuable,
                                     'pct_rel': pct_rel,
                                     'num_left': len(p) - p.num_judged(),
                                     'stamp': p.last_stamp,
                                     'timedate': time.strftime("%a %d %b %Y %H:%M", time.localtime(p.last_stamp))
                                     })
        return(jsonify(data), 200)
    except IOError as e:
        app.logger.exception('I/O error reading dashboard')
        app.logger.exception(e.strerror + ': ' + e.filename)
        return('', 503)
    except Exception:
        app.logger.exception('Unexpected error reading dashboard')
        return('', 503)

@app.route('/pool')
@login_required
@use_args({'t': fields.Str(validate=validate.Regexp(topic_regex))}, location='query')
def get_pool(qargs):
    topic = qargs['t']
    user = current_user.id
    try:
        filename = Path(app.config['SAVE']) / user / f'topic{topic}'
        pool = Pool(filename)
        return(jsonify(pool.as_object()), 200)
    except FileNotFoundError:
        app.logger.debug(f'Pool not found: {user} {topic} {filename}')
        return('', 404)
    except IOError:
        app.logger.debug(f'Error reading pool {user} {topic} {filename}')
        return('', 503)
    except Exception:
        app.logger.exception(f'Unexpected error reading pool {user} {topic} {filename}')
        return('', 503)


@app.route('/doc')
@login_required
@use_args({'i': fields.String(validate=validate.OneOf(indexes)),
           'd': fields.String(validate=validate.Regexp(docid_regex), required=True),
           't': fields.String(validate=validate.Regexp(topic_regex))}, 
          location='query')
def get_document(qargs):
    index = qargs.get('i', None)
    docid = qargs['d']
    topic = qargs['t']
    user = current_user.id

    if not index:
        index = app.config['INDEX']

    try:
        response = es.get(index=index, id=docid)
        if response['found']:
            if topic and user:
                logfile = Path(app.config['SAVE']) / user / f'topic{topic}.log'
                with open(logfile, 'a') as fp:
                    print(json.dumps({'stamp': time.time(),
                                      'docid': docid,
                                      'action': 'load'}), file=fp)
            response['_source']['docid'] = docid
            return(response['_source'], 200)
        else:
            return('', 404)
    except Exception:
        app.logger.exception('Unexpected error getting docid ' + docid)
        return('', 503)


@app.route('/judge', methods=['POST'])
@login_required
@use_args({'t': fields.Str(validate=validate.Regexp(topic_regex), required=True),
           'd': fields.Str(validate=validate.Regexp(docid_regex), required=True)},
          location='query')
def set_judgment(qargs):
    user = current_user.id
    topic = qargs['t']
    docid = qargs['d']

    payload = request.get_json()

    log_obj = { 'stamp': time.time(),
                'docid': docid }

    for key in ['judgment', 'passage', 'subtopics']:
        if key in payload:
            log_obj[key] = payload[key]

    logfile = Path(app.config['SAVE']) / user / f'topic{topic}.log'
    with open(logfile, 'a') as fp:
        print(json.dumps(log_obj), file=fp)

    return('', 200)

if __name__ == '__main__':
    print('Starting Flask...')
    app.debug = True
    app.run(host = '0.0.0.0')
