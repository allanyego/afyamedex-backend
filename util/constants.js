const APPOINTMENT = {
  STATUSES: {
    UNAPPROVED: "UNAPPROVED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },
  TYPES: {
    VIRTUAL_CONSULTATION: "VIRTUAL_CONSULTATION",
    ONSITE_CONSULTATION: "ONSITE_CONSULTATION",
    ONSITE_TESTS: "ONSITE_TESTS",
  },
};

const USER = {
  ACCOUNT_TYPES: {
    PROFESSIONAL: "PROFESSIONAL",
    INSTITUTION: "INSTITUTION",
    PATIENT: "PATIENT",
  },
};

module.exports = {
  APPOINTMENT,
  USER,
};