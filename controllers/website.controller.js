const { admin } = require("googleapis/build/src/apis/admin");
const mongoose = require("mongoose");
const {
  catchAsync,
  sendResponse,
  AppError,
  parseDynamic,
} = require("../helpers/utils");
// const { db } = require("../models/Web");
const db = mongoose.connection;
const User = require("../models/User");
const Web = require("../models/Web");
const { getSheetLastUpdate, readData } = require("./googleapi.controller");
const { createItem } = require("./item.controller");

const websiteController = {};

//Create Website
websiteController.createWeb = catchAsync(async (req, res, next) => {
  const { name, spreadsheetUrl, template, range, websiteId } = req.body;
  const { currentUserId } = req;

  let admin = await User.findById(currentUserId);

  const urlSpilt = spreadsheetUrl.split("/");
  const spreadsheetId = urlSpilt[5];
  let website = await Web.findOne({ spreadsheetId });
  if (website) {
    throw new AppError(
      409,
      "Website is already generated from this spreadsheet"
    );
  }
  website = await Web.findOne({ websiteId });
  if (website) {
    throw new AppError(409, "Website Id must be unique");
  }

  const lastUpdate = Date.now();
  let dbLastUpdate = await getSheetLastUpdate(spreadsheetId);
  dbLastUpdate = Date.parse(dbLastUpdate.modifiedTime);

  website = await Web.create({
    websiteId,
    author: admin._id,
    name,
    spreadsheetId,
    range,
    template,
    lastUpdate,
    dbLastUpdate,
  });

  await createItem(range, currentUserId, spreadsheetId);
  const itemList = await db
    .collection("items")
    .find({ spreadsheetId })
    .toArray();
  website.date = itemList.map((item) => item._id);
  await website.save();

  return sendResponse(
    res,
    200,
    true,
    { website },
    null,
    "Create Website success"
  );
});

websiteController.getWebList = catchAsync(async (req, res, next) => {
  let { page, limit } = { ...req.query };
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const { currentUserId } = req;

  const count = await Web.countDocuments({ author: currentUserId });
  const totalPage = Math.ceil(count / limit);
  const offset = limit * (page - 1);

  const webList = await Web.find({ author: currentUserId })
    .sort({ createAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("author");

  return sendResponse(
    res,
    200,
    true,
    { webList, totalPage },
    null,
    "Get Website List Successfully"
  );
});

websiteController.getSingleWeb = catchAsync(async (req, res, next) => {
  const { websiteId } = req.params;
  console.log(websiteId);

  const web = await Web.findById(websiteId);

  if (!web) {
    throw new AppError(404, "Website not found");
  }

  return sendResponse(res, 200, true, { web }, null, "Get Single Web sucess");
});

//Update data to Website

module.exports = websiteController;
