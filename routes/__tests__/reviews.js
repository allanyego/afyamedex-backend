const supertest = require("supertest");

const app = require("../../app");
const Review = require("../../models/review");
const Appointment = require("../../models/appointment");
const { USER, APPOINTMENT } = require("../../util/constants");

const request = supertest(app);

const BASE_URL = "/api/v1";

let testDoc = {
  _id: "5f79622bbe2ead0f7152437a",
};
let tempPatient = {
  _id: "5f796274be2ead0f7152437b",
};
let testAppointment;
const url = `${BASE_URL}/reviews`;

beforeAll(async function () {
  const date = new Date();
  try {
    testAppointment = await Appointment.create({
      date,
      time: new Date(date.setHours(date.getHours() + 11)),
      patient: tempPatient._id,
      professional: testDoc._id,
      type: APPOINTMENT.TYPES.VIRTUAL_CONSULTATION,
      subject: "initial meet",
      status: APPOINTMENT.STATUSES.CLOSED,
      duration: 1,
      hasBeenBilled: true,
      paymentId: String(Date.now()),
    });
  } catch (e) {
    console.log("test appointment creation error", e);
  }
});

afterAll(async function () {
  await Review.deleteMany({});
  await Appointment.deleteOne({
    _id: testAppointment._id,
  });
});

describe("/reviews", () => {
  describe("POST /:userId", function () {
    it("should add a new review for appointment", async (done) => {
      try {
        let resp = await request.post(`${BASE_URL}/users/signin`).send({
          username: "marykoi@gmail.com",
          password: process.env.TEST_USER_PASSWORD,
        });

        tempPatient = resp.body.data;

        resp = await request
          .post(`${url}/${testAppointment._id}`)
          .send({
            rating: 4,
            feedback: "I enjoyed this services",
          })
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(201);
        expect(resp.body.status).toBe("success");
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /:userId?rating=true", function () {
    it("should return average user rating", async (done) => {
      try {
        const resp = await request
          .get(`${url}/user/${testAppointment.professional}?rating=true`)
          .set({
            Authorization: `Bearer ${tempPatient.token}`,
          });

        expect(resp.status).toBe(200);
        expect(resp.body.data[0].rating).toBe(4);
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  describe("GET /:appointmentId", function () {
    it("should return appointment review", async (done) => {
      try {
        const resp = await request.get(`${url}/${testAppointment._id}`).set({
          Authorization: `Bearer ${tempPatient.token}`,
        });

        expect(resp.status).toBe(200);
        expect(resp.body.data.rating).toBe(4);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
