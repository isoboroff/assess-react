from flask_login import UserMixin


class User(UserMixin):

    """Custom User class."""

    def __init__(self, username, name, email, dest):
        self.id = email
        self.username = username
        self.name = name
        self.email = email
        self.destination = dest

    def claims(self):
        """Use this method to render all assigned claims on profile page."""
        return {'name': self.name,
                'email': self.email}.items()

    @staticmethod
    def get(email):
        result = USERS_DB.get(email)
        return result

    def get_id(self):
        return self.email

    @staticmethod
    def create(username, name, email):
        USERS_DB[email] = User(username, name, email)
        return USERS_DB[email]

# Simulate user database
USERS_DB = { 
    'darrin.dimmick@nist.gov': User('darrin', 'Darrin', 'darrin.dimmick@nist.gov', 'ikat'),
    'hoa.dang@nist.gov': User('hoa', 'Hoa', 'hoa.dang@nist.gov', 'ikat'),
    'ian.soboroff@nist.gov': User('ian', 'Ian', 'ian.soboroff@nist.gov', 'ikat'),
    'dfmcurry@netscape.net': User('deborah', 'Deborah Curry', 'dfmcurry@netscape.net', 'ikat'),
    'mariannelarking@verizon.net': User('marianne', 'Marianne Larkin', 'mariannelarking@verizon.net', 'ikat'),
    'smallie2@verizon.net': User('wilson', 'Wilson Smallwood', 'smallie2@verizon.net', 'ikat'),
    'sherrideck@comcast.net': User('sherri', 'Sherri Deck', 'sherrideck@comcast.net', 'ikat'),
    'matlife50@gmail.com': User('marie', 'Marie Turgeon', 'matlife50@gmail.com', 'ikat'),
    'alpieru1@yahoo.com': User('angelina', 'Angelina Pierucki', 'alpieru1@yahoo.com', 'ikat'),
}
