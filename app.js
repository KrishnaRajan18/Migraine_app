const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV, CLIENT_ORIGIN } = require("./config");

const loginRouter = require("./auth/login-router");
const usersRouter = require("./users/users-router");
const recordsRouter = require("./records/records-router");
const app = express();

const morganType = NODE_ENV === "production" ? "tiny" : "common";
app.use(morgan(morganType));
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use("/migraine", loginRouter);
app.use("/migraine/users", usersRouter);
app.use("/migraine/records", recordsRouter);
app.use("/migraine/records/:record_id", recordsRouter);
app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
