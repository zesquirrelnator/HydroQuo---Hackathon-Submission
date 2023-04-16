const functions = require("firebase-functions");
const express = require('express');
const app = express();
const combinedData = require('./Data/combinedData.json');

// Route 1: Get unique water site groups and their healthiness scores
app.get('/api/water_sites', (req, res) => {
  const siteGroups = [];
  console.log("New Request")

  for (const siteKey in combinedData) {
    const site = combinedData[siteKey];
    siteGroups.push({
      waterSite: siteKey,
      healthinessScore: site.healthinessScore
    });
  }

  res.json(siteGroups);
});

// Route 2: Get the complete JSON section for a specific monitoring location Site Name
app.get('/api/water_site/:waterSite', (req, res) => {
  const waterSite = req.params.waterSite;
  console.log("New Request")

  if (combinedData.hasOwnProperty(waterSite)) {
    res.json(combinedData[waterSite]);
  } else {
    res.status(404).json({ error: 'Water site not found' });
  }
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
