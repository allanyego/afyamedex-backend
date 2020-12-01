const supertest = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../../app");
const User = require("../../models/user");
const Invite = require("../../models/invite");
const { USER, TEST_RESET_CODE } = require("../../util/constants");

const request = supertest(app);

const BASE_URL = "/api/v1";

afterAll(async function () {
  await User.deleteMany({
    username: {
      $not: { $regex: "^test_" },
    },
  });
  await Invite.deleteMany({});
  await User.updateMany(
    {
      username: {
        $regex: "^test_",
      },
    },
    {
      password: await bcrypt.hash(
        process.env.TEST_USER_PASSWORD,
        Number(process.env.SALT_ROUNDS)
      ),
    }
  );
});

describe("/users", function () {
  let testAdmin = {
    email: "allanyego05@gmail.com",
  };
  let testUser;

  describe("POST /signin", function () {
    it("should return authenticated user", async (done) => {
      try {
        const resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "devyego@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.token).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /reset-password", function () {
    it("should send code to user email", async (done) => {
      try {
        const resp = await request
          .post(`${BASE_URL}/users/reset-password`)
          .send({
            username: "devyego@gmail.com",
          });

        expect(resp.status).toBe(200);
        expect(resp.body.status).toBe("success");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /confirm-reset", function () {
    it("should send code to user email", async (done) => {
      try {
        const resp = await request
          .post(`${BASE_URL}/users/confirm-reset`)
          .send({
            username: "test_yego",
            newPassword: "dot3love",
            resetCode: TEST_RESET_CODE,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.status).toBe("success");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /", function () {
    it("should return newly created user", async (done) => {
      try {
        const date = new Date();
        date.setFullYear(1995);

        const resp = await request.post(`${BASE_URL}/users`).send({
          fullName: "john lu",
          username: "johnlu",
          email: "johnlu@mail.com",
          gender: "male",
          birthday: date,
          password: "test-pass",
        });

        expect(resp.status).toBe(201);
        expect(resp.body.data.token).toBeDefined();
        testUser = resp.body.data;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /invite", function () {
    it("should send admin invite email to user", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "admin@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        resp = await request
          .post(`${BASE_URL}/users/invite`)
          .send(testAdmin)
          .set({
            Authorization: `Bearer ${resp.body.data.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.status).toBe("success");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /", function () {
    it("should return newly created admin", async (done) => {
      try {
        const date = new Date();
        date.setFullYear(1995);

        const resp = await request.post(`${BASE_URL}/users`).send({
          fullName: "yego kip",
          username: "yego05",
          gender: "male",
          birthday: date,
          password: "test-password",
          code: TEST_RESET_CODE,
          ...testAdmin,
        });

        expect(resp.status).toBe(201);
        expect(resp.body.data.token).toBeDefined();
        testAdmin = resp.body.data;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /:userId", function () {
    it("should return user by id", async (done) => {
      try {
        const resp = await request.get(`${BASE_URL}/users/${testUser._id}`);

        expect(resp.status).toBe(200);
        expect(resp.body.data.username).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("PUT /:userId", function () {
    it("should update user details without error", async (done) => {
      try {
        const date = new Date();
        date.setFullYear(1995);

        const resp = await request
          .put(`${BASE_URL}/users/${testUser._id}`)
          .send({
            accountType: USER.ACCOUNT_TYPES.PROFESSIONAL,
          })
          .set({
            Authorization: `Bearer ${testUser.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.status).toBe("success");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("PUT /:userId", function () {
    it("should disable user without error", async (done) => {
      try {
        const resp = await request
          .put(`${BASE_URL}/users/${testUser._id}`)
          .send({
            disabled: true,
          })
          .set({
            Authorization: `Bearer ${testAdmin.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.status).toBe("success");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /", function () {
    it("should return non-patient users with defined account types (non-disabled)", async (done) => {
      try {
        const resp = await request.get(`${BASE_URL}/users`).set({
          Authorization: `Bearer ${testUser.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBe(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET ?username=username", function () {
    it("should return patient users matching username expression", async (done) => {
      try {
        const resp = await request
          .get(`${BASE_URL}/users?username=test_&patient=true`)
          .set({
            Authorization: `Bearer ${testUser.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBe(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
