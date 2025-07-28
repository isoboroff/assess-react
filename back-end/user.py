from flask_login import UserMixin


class User(UserMixin):

    """Custom User class."""

    def __init__(self, username, name, email):
        self.id = username
        self.name = name
        self.email = email
        self.destination = None

    def claims(self):
        """Use this method to render all assigned claims on profile page."""
        return {'name': self.name,
                'email': self.email}.items()

    @staticmethod
    def get(username):
        result = USERS_DB.get(username)
        return result

    def get_id(self):
        return self.email

# Simulate user database
USERS_DB = { 
    'ian.soboroff@nist.gov': User('ian', 'Ian', 'ian.soboroff@nist.gov'),
}

