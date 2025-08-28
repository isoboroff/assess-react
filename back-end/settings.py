# ElasticSearch host
ELASTIC_HOST='localhost'

# ElasticSearch port
ELASTIC_PORT=9200

# Directory for saving assessor work
SAVE='relevance'

# ElasticSearch index
INDEX='marcov2.1'

# Logging
LOGLEVEL='DEBUG'
DEBUG=True

# Timezone for dashboard
TZ='US/Eastern'
from pathlib import Path

LOGIN_PROXY_URL = 'http://127.0.0.1:8080/login'
# LOGIN_PROXY_URL = 'https://ir.nist.gov/bench2/login'
PRIVATE_KEY_FILE = 'assess.private.pem'
