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
  },
  serializeRecord(record) {
    return {
      id: record.id,
      intensity: record.intensity,
      location: record.location,
      onset: record.onset,
      symptom: record.symptom,
      time: record.time,
      trigger: record.trigger,
      symptom: record.symptom,
      treatment: record.treatment,
      comment: xss(record.comment)
    };
  },
  getRecordsById(knex, id) {
    return knex
      .from("migraine_records")
      .select("*")
      .where("user_id", id);
  },
  getHighestStat(knex, id) {
    return knex
      .from("migraine_records")
      .where("user_id", id)
      .select("location")
      .count("*")
      .groupBy("location")
      .orderBy("count", "desc")
      .select("time")
      .count("*")
      .groupBy("time")
      .orderBy("count", "desc")
      .select("onset")
      .count("*")
      .groupBy("onset")
      .orderBy("count", "desc")
      .select("intensity")
      .avg("intensity")
      .groupBy("intensity")
      .orderBy("count", "desc")
      .select("trigger")
      .count("*")
      .groupBy("trigger")
      .orderBy("count", "desc")
      .select("symptom")
      .count("*")
      .groupBy("symptom")
      .orderBy("count", "desc")
      .select("treatment")
      .count("*")
      .groupBy("treatment")
      .orderBy("count", "desc")
      .first();
  }
};

module.exports = UsersService;
