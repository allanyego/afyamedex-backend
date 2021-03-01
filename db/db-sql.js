const pg = require("pg");
require("pg-camelcase").inject(pg);

let pool;
const { NODE_ENV, DATABASE_URL } = process.env;
if (NODE_ENV === "production" && DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
  pool = new pg.Pool();
}

module.exports = {
  query: (...args) => pool.query(...args),
  checkoutClient: () => pool.connect(),
};
