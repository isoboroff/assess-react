# ElasticSearch host
ELASTIC_HOST='localhost'

# ElasticSearch port
ELASTIC_PORT=9200

# Directory for saving assessor work
SAVE='relevance'

# ElasticSearch index
INDEX='ragtime'

# Password file
PWFILE='passwd'

# Logging
LOGLEVEL='DEBUG'
DEBUG=True

# Timezone for dashboard
TZ='US/Eastern'
from pathlib import Path

LOGIN_PROXY_URL = 'http://127.0.0.1:8080/login'
# LOGIN_PROXY_URL = 'https://ir.nist.gov/bench2/login'
PRIVATE_KEY_FILE = 'assess.private.pem'

# Login_gov stuff
LOGIN_GOV = {
    # production
    #  "discovery_uri": "https://secure.login.gov/.well-known/openid-configuration",
    #  "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:nist:bench2",
    #  "redirect_uri": "http://localhost:8080/authorization-code/callback"

    # dev
    "discovery_uri": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
    "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:nist:bench2-sb",
    "redirect_uri": "http://127.0.0.1:8080/authorization-code/callback"
}
