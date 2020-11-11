const supertest = require("supertest");

const app = require("../../app");
const Condition = require("../../models/condition");

const request = supertest(app);

const BASE_URL = "/api/v1";

afterAll(async function () {
  await Condition.deleteMany({});
});

describe("/conditions", function () {
  const url = `${BASE_URL}/conditions`;
  let testCondition, testAdmin, testUser;

  describe("GET /", function () {
    it("should return list of conditions", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "tomhanks@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });
        testUser = resp.body.data;

        resp = await request.get(url).set({
          Authorization: `Bearer ${testUser.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /", function () {
    it("should return newly created condition", async (done) => {
      try {
        const resp = await request
          .post(url)
          .send({
            name: "depression",
            description:
              "depression has been a nuisance to many of out young population, it's a killer.",
            symptoms: `isolation
demotivation
irritation
anxiety`,
            remedies: `cognitive therapy
social therapy
interaction
meditation`,
          })
          .set({
            Authorization: `Bearer ${testUser.token}`,
          });

        expect(resp.status).toBe(201);
        expect(resp.body.data.symptoms).toBeDefined();
        testCondition = resp.body.data;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /:conditionId", function () {
    it("should return condition by given id", async (done) => {
      try {
        const resp = await request.get(`${url}/${testCondition._id}`).set({
          Authorization: `Bearer ${testUser.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.description).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("PUT /:conditionId", function () {
    it("should disable condition post without error", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "admin@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        testAdmin = resp.body.data;

        resp = await request
          .put(`${BASE_URL}/conditions/${testCondition._id}`)
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
});
