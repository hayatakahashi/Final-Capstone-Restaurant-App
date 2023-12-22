const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const service = require("./reservations.service");

const VALID_RESERVATION_FIELDS = [
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people",
];


// Helper to check time format
function _validateTime(timeString) {
  const splitTime = timeString.split(":");
  const hour = splitTime[0];
  const minute = splitTime[1];

  if (hour.length > 2 || minute.length > 2) {
    return false;
  }
  if (!(hour >= 1 && hour <= 23)) {
    return false;
  }
  if (!(minute >= 0 && minute <= 59)) {
    return false;
  }

  return true;
}

// Middleware for checking if reservation exists
const reservationExists = async (req, res, next) => {
  const reservationId = req.params.reservation_Id;
  const foundReservation = await service.read(reservationId);

  if (!foundReservation) {
    return next({
      status: 404,
      message: `Reservation_id ${reservationId} does not exist.`,
    });
  }

  res.locals.reservation = foundReservation;
  next();
};

// Validates if the reservation data is valid
function isValidReservation(req, res, next) {
  const { data: reservation } = req.body;

  if (!reservation) {
    return next({ status: 400, message: `Must have data property.` });
  }

  for (const field of VALID_RESERVATION_FIELDS) {
    if (!reservation[field]) {
      return next({ status: 400, message: `${field} field required` });
    }

    switch (field) {
      case "people":
        if (typeof reservation[field] !== "number") {
          return next({
            status: 400,
            message: `${reservation[field]} is not a number type for people field.`,
          });
        }
        break;
      case "reservation_date":
        if (!Date.parse(reservation[field])) {
          return next({ status: 400, message: `${field} is not a valid date.` });
        }
        break;
      case "reservation_time":
        if (!_validateTime(reservation[field])) {
          return next({ status: 400, message: `${field} is not a valid time` });
        }
        break;
    }
  }

  next();
}

// Ensures the reservation date is not on a Tuesday
function isNotOnTuesday(req, res, next) {
  const reservationDate = req.body.data.reservation_date;
  const date = new Date(reservationDate + 'T00:00'); // Ensure correct parsing

  // Save the date to res.locals for other middleware
  res.locals.date = date;

  // Check if the day is Tuesday (getDay() returns 2 for Tuesday)
  if (date.getDay() === 2) {
    return next({ status: 400, message: "Location is closed on Tuesdays" });
  }

  next();
}

// Verifies that the reservation date is in the future
function isInTheFuture(req, res, next) {
  const today = new Date();
  const reservationDate = res.locals.date;

  if (reservationDate < today) {
    return next({ status: 400, message: "Must be a future date" });
  }

  next();
}

// Checks if reservation is within business hours
function isWithinOpenHours(req, res, next) {
  const reservation = req.body.data;
  const [hour, minute] = reservation.reservation_time.split(":");

  if (hour < 10 || hour > 21) {
    return next({
      status: 400,
      message: "Reservation must be made within business hours",
    });
  }
  if ((hour < 11 && minute < 30) || (hour > 20 && minute > 30)) {
    return next({
      status: 400,
      message: "Reservation must be made within business hours",
    });
  }

  next();
}

// Checks if reservation has an invalid status
function hasBookedStatus(req, res, next) {
  const { status } = res.locals.reservation || req.body.data;

  const invalidStatuses = ["seated", "finished", "cancelled"];
  if (invalidStatuses.includes(status)) {
    return next({
      status: 400,
      message: `New reservation cannot have ${status} status.`,
    });
  }

  next();
}

// Ensures the reservation status is valid
function isValidStatus(req, res, next) {
  const VALID_STATUSES = ["booked", "seated", "finished", "cancelled"];
  const { status } = req.body.data;

  if (!VALID_STATUSES.includes(status)) {
    return next({ status: 400, message: "Status unknown." });
  }

  next();
}

// Prevents changing a reservation with a 'finished' status
function isAlreadyFinished(req, res, next) {
  const { status } = res.locals.reservation;

  if (status === "finished") {
    return next({
      status: 400,
      message: "Cannot change a reservation with a finished status.",
    });
  }

  next();
}


async function create(req, res) {
  const { data: reservation } = req.body;
  const newReservation = await service.create(reservation);

  res.status(201).json({ data: { ...reservation, reservation_id: newReservation.reservation_id } });
}

async function read(req, res) {
  const { reservation } = res.locals;
  res.json({ data: reservation });
}

async function update(req, res) {
  const { reservation_Id } = req.params;
  const updatedReservation = await service.update(reservation_Id, req.body.data.status);

  res.json({ data: updatedReservation });
}

async function modify(req, res, next) {
  const { reservation_Id } = req.params;
  const reservation = req.body.data;
  const data = await service.modify(reservation_Id, reservation);

  reservation.reservation_id = data.reservation_id;
  res.json({ data: reservation });
}



async function list(req, res) {
  const { date, mobile_number } = req.query;
  const reservations = mobile_number 
  ? await service.search(mobile_number) 
  : await service.listByDate(date || '');

  res.json({ data: reservations });
}

module.exports = {
  create: [
    asyncErrorBoundary(isValidReservation),
    isNotOnTuesday,
    isInTheFuture,
    isWithinOpenHours,
    hasBookedStatus,
    asyncErrorBoundary(create),
  ],
  read: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(read)],
  update: [
    asyncErrorBoundary(reservationExists),
    isValidStatus,
    isAlreadyFinished,
    asyncErrorBoundary(update),
  ],
  modify: [
    isValidReservation,
    isNotOnTuesday,
    isInTheFuture,
    isWithinOpenHours,
    asyncErrorBoundary(reservationExists),
    hasBookedStatus,
    asyncErrorBoundary(modify),
  ],
  list: asyncErrorBoundary(list),
};
