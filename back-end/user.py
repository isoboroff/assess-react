from flask_login import UserMixin


class User(UserMixin):

    """Custom User class."""

    def __init__(self, username, name, email):
        self.id = username
        self.username = username
        self.name = name
        self.email = email

    def claims(self):
        """Use this method to render all assigned claims on profile page."""
        return {'name': self.name,
                'email': self.email}.items()

    @staticmethod
    def get(id):
        print(f'user:User.get({id})')
        result = USERS_DB.get(id)
        return result

    def get_id(self):
        print(f'user:User.get_id() -> {self.id}')
        return self.id

    @staticmethod
    def create(username, name, email):
        USERS_DB[username] = User(username, name, email)
        return USERS_DB[username]

# Simulate user database
USERS_DB = {
    'ian': User('ian', 'Ian', 'ian.soboroff@nist.gov'),
}
