const express = require("express");
const xss = require("xss");
const path = require("path");
const usersRouter = express.Router();
const jsonBodyParser = express.json();
const usersService = require("./users-service");
const RecordsService = require("../records/records-service");
const { requireAuth } = require("../middleware/jwt-auth");
const jsonParser = express.json();

const serializeUser = user => ({
  user_id: user.id,
  first_name: xss(user.first_name),
  last_name: xss(user.last_name),
  email: xss(user.email),
  password: xss(user.password),
  date_created: new Date(user.date_created)
});
const serializeRecord = record => ({
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
});

//get All users&&post an new user
usersRouter
  .route("/")
  .get((req, res, next) => {
    usersService
      .getAllUsers(req.app.get("db"))
      .then(users => {
        res.json(users.map(serializeUser));
      })
      .catch(next);
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { first_name, last_name, email, password } = req.body;
    for (const field of ["first_name", "last_name", "email", "password"])
      if (!req.body[field])
        return res.status(400).json({
          error: `Missing '${field}' in form.`
        });
    const passwordError = usersService.validatePassword(password);

    if (passwordError) return res.status(400).json({ error: passwordError });

    usersService
      .hasUserWithUserEmail(req.app.get("db"), email)
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: `Email already taken` });

        return usersService.hashPassword(password).then(hashedPassword => {
          const newUser = {
            first_name,
            last_name,
            email,
            password: hashedPassword
          };
          return usersService
            .insertUser(req.app.get("db"), newUser)
            .then(user => {
              res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                .json(usersService.serializeUser(user));
            });
        });
      })
      .catch(next);
  });

//get users by id && delete user by its id
usersRouter
  .route("/:user_id")
  .all((req, res, next) => {
    const { user_id } = req.params;
    usersService
      .getById(req.app.get("db"), user_id)
      .then(user => {
        if (!user) {
          return res
            .status(404)
            .send({ error: { message: `User doesn't exist.` } });
        }
        res.user = user;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(usersService.serializeUser(res.user));
  })
  .delete((req, res, next) => {
    const { user_id } = req.params;
    usersService
      .deleteUser(req.app.get("db"), user_id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });
// Individual user, all records -- GET ALL RECORDS OF A USER, POST A NEW RECORD FOR A USER
usersRouter
  .route("/:user_id/records")
  .all(requireAuth)

  .all((req, res, next) => {
    const { user_id } = req.params;
    usersService
      .getRecordsById(req.app.get("db"), user_id)
      .then(record => {
        if (!record) {
          return res
            .status(404)
            .json({ error: { message: `No records exist.` } });
        }
        res.record = record;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(res.record);
  })
  .post(requireAuth, jsonParser, (req, res, next) => {
    const {
      location,
      time,
      onset,
      intensity,
      trigger,
      symptom,
      treatment,
      comment
    } = req.body;
    const newRecord = {
      location,
      time,
      onset,
      intensity,
      trigger,
      symptom,
      treatment,
      comment
    };

    for (const [key, value] of Object.entries(newRecord))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });

    newRecord.user_id = req.user.id;

    RecordsService.insertUserRecord(req.app.get("db"), newRecord)
      .then(record => {
        res.status(201).json(serializeRecord(record));
      })
      .catch(next);
  });

// Individual user, individual record - GET BY ID, DELETE BY ID , UPDATE BY ID
usersRouter
  .route("/:user_id/records/:record_id")
  .all(requireAuth)
  .all((req, res, next) => {
    RecordsService.getById(req.app.get("db"), req.params.record_id)
      .then(record => {
        if (!record) {
          return res.status(404).json({
            error: { message: `Record doesn't exist` }
          });
        }
        res.record = record;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(res.record);
  })
  .delete((req, res, next) => {
    RecordsService.deleteRecord(req.app.get("db"), req.params.record_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const {
      location,
      time,
      onset,
      intensity,
      trigger,
      symptom,
      treatment,
      comment
    } = req.body;
    const recordToUpdate = {
      location,
      time,
      onset,
      intensity,
      trigger,
      symptom,
      treatment,
      comment
    };

    RecordsService.updateRecord(
      req.app.get("db"),
      req.params.record_id,
      recordToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

// Individual user stats -- GET THE STATS OF A CURRENT USER -BY ID
usersRouter
  .route("/:user_id/stats")
  .all(requireAuth)
  .all((req, res, next) => {
    const { user_id, location, time } = req.params;
    usersService
      .getHighestStat(req.app.get("db"), user_id, location, time)
      .then(data => {
        if (!data) {
          return res.send({ error: { message: `No statistic recorded yet.` } });
        }
        res.data = data;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(res.data);
  });

module.exports = usersRouter;
