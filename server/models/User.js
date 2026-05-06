const { User } = require("../config/localDB");
const bcrypt = require("bcryptjs");

// Add back the pre-save hook logic in a mock-compatible way if necessary
// But for now, we'll just export the local User object
module.exports = User;

