const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  university: {
    type: String,
    default: ""
  },
  semester: {
    type: String,
    default: ""
  },
  branch: {
    type: String,
    default: ""
  },
  targetRole: {
    type: String,
    default: ""
  },
  targetCompanies: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);