const supertest = require("supertest");

const app = require("../../app");
const Message = require("../../models/message");
const Thread = require("../../models/thread");

const request = supertest(app);

const BASE_URL = "/api/v1";

afterAll(async function () {
  await Message.deleteMany({});
  await Thread.deleteMany({
    name: {
      $not: {
        $regex: "^test_",
      },
    },
  });
});

describe("/messages", function () {
  const url = `${BASE_URL}/messages`;
  let tempDoc = {
    _id: "5f79622bbe2ead0f7152437a",
  };
  let testGroupThread = {
    _id: "5f8c89d0a2acfa99c3b3e077",
  };
  let tempPatient, testThread;

  describe("POST /", function () {
    it("should return newly created thread", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "marykoi@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        if (!resp.body.data.token) {
          throw new Error("Authentication failed.");
        }

        tempPatient = resp.body.data;

        resp = await request
          .post(url)
          .send({
            sender: tempPatient._id,
            recipient: tempDoc._id,
            body: "hi, tom",
          })
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(201);
        expect(resp.body.data.lastMessage).toBeDefined();
        testThread = resp.body.data;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("POST /", function () {
    it("should successfully post new message to public group", async (done) => {
      try {
        let resp = await request
          .post(url)
          .send({
            sender: tempPatient._id,
            thread: testGroupThread._id,
            body: "hi, world",
          })
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(201);
        expect(resp.body.data.lastMessage).toBeDefined();
        testThread = resp.body.data;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /", function () {
    it("should return a list of public threads", async (done) => {
      try {
        const resp = await request.get(url).set({
          Authorization: `Bearer ${tempPatient.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBe(1);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /:threadId", function () {
    it("should return a list of user messages", async (done) => {
      try {
        const resp = await request.get(`${url}/${testThread._id}`).set({
          Authorization: `Bearer ${tempPatient.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /user-threads/:userId", function () {
    it("should return a list of user threads", async (done) => {
      try {
        const resp = await request
          .get(`${url}/user-threads/${tempPatient._id}`)
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /user-messages?users=userA;userB", function () {
    it("should return a list of messages between specified users", async (done) => {
      try {
        const resp = await request
          .get(`${url}/user-messages?users=${tempPatient._id};${tempDoc._id}`)
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
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
