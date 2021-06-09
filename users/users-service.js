const xss = require("xss");
const bcrypt = require("bcryptjs");

const UsersService = {
  getAllUsers(knex) {
    return knex.select("*").from("migraine_users");
  },
  hasUserWithUserEmail(db, email) {
    return db("migraine_users")
      .where({ email })
      .first()
      .then(user => !!user);
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into("migraine_users")
      .returning("*")
      .then(([user]) => user);
  },
  validatePassword(password) {
    if (password.length < 6) {
      return "Password must be longer than 6 characters";
    }
    if (password.length > 72) {
      return "Password must be less than 72 characters";
    }
    if (password.startsWith(" ") || password.endsWith(" ")) {
      return "Password must not start or end with empty spaces";
    }
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  serializeUser(user) {
    return {
      id: user.id,
      first_name: xss(user.first_name),
      last_name: xss(user.last_name),
      email: xss(user.email),
      date_created: new Date(user.date_created)
    };
  },
  deleteUser(knex, id) {
    return knex("migraine_users")
      .where({ id })
      .delete();
  },
  getById(knex, id) {
    return knex
      .from("migraine_users")
      .select("*")
      .where("id", id)
      .first();
  }
};

module.exports = UsersService;
