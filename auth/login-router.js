const express = require("express");
const loginService = require("./login-service");

const loginRouter = express.Router();
const jsonBodyParser = express.json();

loginRouter.post("/login", jsonBodyParser, (req, res, next) => {
  const { email, password } = req.body;
  const loginUser = { email, password };

  for (const [key, value] of Object.entries(loginUser))
    if (value == null)
      return res.status(400).json({
        error: `Missing '${key}' in form`
      });
  loginService
    .getUserWithUserEmail(req.app.get("db"), loginUser.email)
    .then(User => {
      if (!User)
        return res.status(400).json({
          error: "Email not registered"
        });
      return loginService
        .comparePasswords(loginUser.password, User.password)
        .then(compareMatch => {
          if (!compareMatch)
            return res.status(400).json({
              error: "Invalid password"
            });

          const payload = { user_id: User.id };
          res.send({
            authToken: loginService.createJwt(User.email, payload),
            userId: User.id,
            userName: User.first_name
          });
        });
    })
    .catch(next);
});

module.exports = loginRouter;
