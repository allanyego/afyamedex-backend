const jwt = require("jsonwebtoken");

const createResponse = require("../routes/helpers/create-response");

const auth = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (authorizationHeader) {
      const token = authorizationHeader.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.APP_SECRET);
      const { userId, userAccountType } = decodedToken;

      if (userId) {
        res.locals.userId = userId;
        res.locals.userAccountType = userAccountType;
        next();
      } else {
        res.status(403).json(
          createResponse({
            error: "Authorization failed.",
          })
        );
      }
    } else {
      res.status(403).json(
        createResponse({
          error: "Unauthorized request.",
        })
      );
    }
  } catch (e) {
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json(
        createResponse({
          error: e.message,
        })
      );
    }
    next(e);
  }
};

module.exports = auth;
