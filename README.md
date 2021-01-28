##### React-Assess

This is a document assessment tool implemented in Python/Flask (backend) and React (frontend).  The goals are to keep things simple, with the exception that it will support labeling with highlighting as well as selecting a relevance level for an entire document.

#### Running

Currently the code is set up for development.  First, you need an ElasticSearch server running on localhost:9200.  The URL for the ElasticSearch endpoint is in back-end/server.py.

For the back end, first set up a virtual environment and install all the dependencies listed in `requirements.txt`:
```
cd back-end
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

Then, start the backend server: `python server.py`.

For the front end, you'll need Node.js (v14+) and Yarn (v1.22+):
```
cd front-end
yarn install
yarn build
```

At this point, you should be able to browse to localhost:5000 and use the tool.

#### Setup

The back end looks for pools to assess in a directory `back-end/relevance`.  In there you should create a directory for each user.  A pool for topic 123 should be in the file topic123, and the topic description should be in topic123.desc.

#### Deploy

I've included a `uwsgi.ini` script in `back-end/` that is configured to run the `server.py` application through a domain socket `uwsgi.sock`.  You'll need a clause in your `nginx.conf` like so:
```
        location = /assess { rewrite ^ /assess/; }
        location /assess { try_files $uri @assess; }
        location @assess {
                include uwsgi_params;
                uwsgi_pass unix:/home/ubuntu/react-assess/back-end/uwsgi.sock;
        }
```

In `front-end/package.json`, the `homepage` setting needs to be `"."`.  The full path to uwsgi.sock and the relevance directories in `backend` need to be readable and executable by the nginx server process.
