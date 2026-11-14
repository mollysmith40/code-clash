//Detect Device Type for Dimensions, UI
const express = require("express");
const DeviceDetector = require("node-device-detector");
const DeviceHelper = require("node-device-detector/helper");
const ClientHints = require("node-device-detector/client-hints");

const app = express();

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  osIndexes: true,
  deviceAliasCode: false,
  deviceTrusted: false,
  deviceInfo: false,
});
const clientHints = new ClientHints();

app.get("/api/device", async (req, res) => {
  const userAgent = req.headers["user-agent"] || "";
  const hints = clientHints.parse(req.headers, {}); // full headers object, not just the UA
  const result = await detector.detectAsync(userAgent, hints);

  console.log(result);

  res.json({
    result,
    deviceType: DeviceHelper.getDeviceType(result),
    isMobile: DeviceHelper.isMobile(result),
    isDesktop: DeviceHelper.isDesktop(result),
  });
});

app.listen(3000, () => console.log("http://localhost:3000"));
app.listen(3000, )