const fs = require("fs");
const path = require("path");
const supertest = require("supertest");

const app = require("../../app");
const Appointment = require("../../models/appointment");
const { APPOINTMENT } = require("../../util/constants");

const request = supertest(app);

const BASE_URL = "/api/v1";

let testFile;

afterAll(async function () {
  await Appointment.deleteMany({});
  if (testFile) {
    fs.unlink(path.join(__dirname, "..", "..", "uploads", testFile), (err) => {
      if (err) {
        console.log("error deleting file", testFile, err);
      }
    });
  }
});

describe("/appointments", function () {
  const url = `${BASE_URL}/appointments`;
  let tempDoc = {
    _id: "5f79622bbe2ead0f7152437a",
  };
  let tempPatient;
  let tempAppointment;

  describe("POST /:professionaId", function () {
    it("should return newly created appointment", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "marykoi@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        if (!resp.body.data.token) {
          throw new Error("Authentication failed.");
        }

        tempPatient = resp.body.data;

        const date = new Date();
        resp = await request
          .post(`${url}/${tempDoc._id}`)
          .send({
            date,
            time: new Date(date.setHours(date.getHours() + 5)),
            patient: tempPatient._id,
            type: APPOINTMENT.TYPES.ONSITE_TESTS,
            duration: 2,
            subject: "initial tests",
          })
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(201);
        expect(resp.body.data.subject).toBeDefined();
        tempAppointment = resp.body.data;
        done();
      } catch (error) {
        done(error);
      }
    }, 10000);
  });

  describe("PUT /:appointmentId", function () {
    it("should return update appointment details successfully", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "tomhanks@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        if (!resp.body.data.token) {
          throw new Error("Authentication failed.");
        }

        tempDoc = resp.body.data;

        resp = await request
          .put(`${url}/${tempAppointment._id}`)
          .set({
            Authorization: `Bearer ${tempDoc.token}`,
          })
          .field("status", APPOINTMENT.STATUSES.CLOSED)
          .field("amount", 50)
          .field("testSummary", "you seem to be ok")
          .attach("testFile", __dirname + "/testdoc.docx");

        expect(resp.status).toBe(200);
        expect(resp.body.status).toBe("success");
        expect(resp.body.data.testFile).toBeDefined();
        testFile = resp.body.data.testFile;
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /checkout/:appointmentId", function () {
    it("should fail if payer is not the patient", async (done) => {
      try {
        const resp = await request
          .get(`${url}/checkout/${tempAppointment._id}`)
          .set({
            Authorization: `Bearer ${tempDoc.token}`,
          });

        expect(resp.status).toBe(401);
        done();
      } catch (error) {
        done(error);
      }
    });

    it("should succeed if payer is the patient", async (done) => {
      try {
        const resp = await request
          .get(`${url}/checkout/${tempAppointment._id}`)
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.data.clientSecret).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /:userId", function () {
    it("should return a list of user appointments", async (done) => {
      try {
        const resp = await request.get(`${url}/${tempPatient._id}`).set({
          Authorization: `Bearer ${tempPatient.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.length).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });

    it("should fail", async (done) => {
      try {
        const resp = await request.get(`${url}/${tempDoc._id}`).set({
          Authorization: `Bearer ${tempPatient.token}`,
        });

        expect(resp.status).toBe(401);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
