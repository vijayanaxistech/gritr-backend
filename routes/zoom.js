const express = require("express");
const router = express.Router();
const zoomController = require("../Controller/zoomController");
const { isAuth } = require("../middleware/auth");

router.post("/create-meeting", isAuth, zoomController.createMeeting);
router.get("/get-meeting-mobile", zoomController.getMeetingMobile);
router.get("/get-meeting", isAuth, zoomController.getMeeting);
router.get("/:id/:type", isAuth, zoomController.meetingDetails);
router.get("/meeting-client", isAuth, zoomController.meetingListForClient);

module.exports = router;
