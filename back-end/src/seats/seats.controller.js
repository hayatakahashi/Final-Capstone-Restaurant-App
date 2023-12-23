const service = require("./seats.service");
const reservationService = require("../reservations/reservations.service");
const tableService = require("../tables/tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

// Middleware for checking if reservation exists
async function reservationExists(req, res, next) {
  const { reservation_id } = req.body.data;
  const reservation = await reservationService.read(reservation_id);

  if (!reservation) {
    return next({ status: 404, message: `Reservation ${reservation_id} not found.` });
  }

  res.locals.reservation = reservation;
  next();
}

// Middleware to check if reservation_id is present in request
function hasReservationId(req, res, next) {
  if (!req.body.data) {
    return next({ status: 400, message: "Must include data in request body." });
  }

  const { reservation_id } = req.body.data;
  if (!reservation_id) {
    return next({ status: 400, message: "Must include reservation_id in data." });
  }

  next();
}


// Middleware to check if reservation is already seated
function isAlreadySeated(req, res, next) {
  if (res.locals.reservation.status === "seated") {
    return next({ status: 400, message: "Reservation is already seated." });
  }

  next();
}

// Middleware to validate table capacity and occupancy
async function tableIsValid(req, res, next) {
  const { table_id } = req.params;
  const currentTable = await tableService.read(table_id);
  const { people, reservation_id } = res.locals.reservation;

  if (people > currentTable.capacity) {
    return next({ status: 400, message: "Table does not have enough capacity." });
  }
  if (currentTable.reservation_id && currentTable.reservation_id !== reservation_id) {
    return next({ status: 400, message: "Table is occupied." });
  }

  next();
}

// Middleware to check if table is occupied
async function tableIsOccupied(req, res, next) {
  const { table_id } = req.params;
  const table = await tableService.read(table_id);

  if (!table) {
    return next({ status: 404, message: `Table ${table_id} not found.` });
  }
  if (!table.reservation_id) {
    return next({ status: 400, message: "Table is not occupied." });
  }

  res.locals.reservation_id = table.reservation_id;
  next();
}

// Handler for updating a seat assignment
async function update(req, res) {
  const { table_id } = req.params;
  const { reservation_id } = req.body.data;

  await service.update(table_id, reservation_id);
  res.status(200).json({ data: { reservation_id } });
}

// Handler for unassigning a seat
async function unassign(req, res) {
  const { table_id } = req.params;
  await reservationService.finish(res.locals.reservation_id);
  await service.update(table_id, null);

  res.status(200).json({ message: "Table unassigned successfully." });
}

module.exports = {
  update: [
    hasReservationId,
    asyncErrorBoundary(reservationExists),
    isAlreadySeated,
    asyncErrorBoundary(tableIsValid),
    asyncErrorBoundary(update),
  ],
  unassign: [asyncErrorBoundary(tableIsOccupied), asyncErrorBoundary(unassign)],
};
