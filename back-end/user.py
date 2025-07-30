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
    'darrin.dimmick@nist.gov': User('darrin', 'Darrin', 'darrin.dimmick@nist.gov', 'assess'),
    'hoa.dang@nist.gov': User('hoa', 'Hoa', 'hoa.dang@nist.gov', 'assess'),
    'ian.soboroff@nist.gov': User('ian', 'Ian', 'ian.soboroff@nist.gov', 'assess'),
    'pechnikova@gmail.com': User('anna', 'Anna Pechnikova', 'pechnikova@gmail.com', 'assess'),
    'hshaobo@gmail.com': User('shaobo', 'Huang Shaobo', 'hshaobo@gmail.com', 'assess'),
    'eddy03161949@gmail.com': User('aassaad', 'Aayaad Assaad', 'eddy03161949@gmail.com', 'assess'),
    'emtf8009@gmail.com': User('lucy', 'Lucy Wang', 'emtf8009@gmail.com', 'assess'),
    'elenaworksathome@gmail.com': User('elena', 'Elena Prisekin', 'elenaworksathome@gmail.com', 'assess'),
    'lchen1965@gmail.com': User('lijun', 'Lijun Chen', 'lchen1965@gmail.com', 'assess'),
    'natallia.jones22@gmail.com': User('natallia', 'Natallia Cherashneva', 'natallia.jones22@gmail.com', 'assess'),
    'mvrichaud@gmail.com': User('marina', 'Marina Richaud', 'mvrichaud@gmail.com', 'assess'),
    'nada_fayad@hotmail.com': User('nada', 'Nada Fayad', 'nada_fayad@hotmail.com', 'assess'),
    'davewoosley@gmail.com': User('dave', 'Dave Woosley', 'davewoosley@gmail.com', 'assess'),
    'yanbahd43@gmail.com': User('peter', 'Peter Schultz', 'yanbahd43@gmail.com', 'assess')
}
