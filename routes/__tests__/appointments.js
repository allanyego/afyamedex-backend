const supertest = require("supertest");

const app = require("../../app");
const Appointment = require("../../models/appointment");
const { APPOINTMENT } = require("../../util/constants");

const request = supertest(app);

const BASE_URL = "/api/v1";

afterAll(async function () {
  await Appointment.deleteMany({});
});

describe("/appointments", function () {
  const url = `${BASE_URL}/appointments`;
  let tempDoc = {
    _id: "5f79622bbe2ead0f7152437a",
  };
  let tempPatient;
  let tempAppointment;

  describe("POST /:professionalId", function () {
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
            type: APPOINTMENT.TYPES.VIRTUAL_CONSULTATION,
            subject: "initial meet",
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
    });
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
          .send({
            status: APPOINTMENT.STATUSES.CLOSED,
            minutesBilled: 35,
          })
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
