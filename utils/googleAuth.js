const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
    '812727128915-pjdracpnf7dalh7ppeagmtfhkea0vf3s.apps.googleusercontent.com'
);

module.exports = client; 