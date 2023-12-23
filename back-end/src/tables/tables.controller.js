const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const service = require("./tables.service");

const VALID_FIELDS = ["table_name", "capacity"];

function isValidTable(req, res, next) {
  const { data: table } = req.body;
  if (!table) {
    return next({ status: 400, message: "Data property is missing." });
  }

  for (const field of VALID_FIELDS) {
    if (!table[field]) {
      return next({ status: 400, message: `${field} is missing.` });
    }
  }

  if (typeof table.capacity !== "number" || table.capacity < 1) {
    return next({
      status: 400,
      message: "capacity: Capacity must be a number greater than 0.",
    });
  }

  if (table.table_name.length < 2) {
    return next({
      status: 400,
      message: "table_name: Table name must be at least two characters long.",
    });
  }

  next();
}

async function create(req, res) {
  const table = req.body.data;
  const newTable = await service.create(table);
  
  const responseData = {
    ...newTable,
    capacity: Number(newTable.capacity)  // Ensure capacity is a number
  };

  res.status(201).json({ data: responseData });
}

async function list(req, res) {
  const data = await service.list();
  res.json({ data });
}

module.exports = {
  create: [isValidTable, asyncErrorBoundary(create)],
  list: asyncErrorBoundary(list),
  isValidTable,
};
