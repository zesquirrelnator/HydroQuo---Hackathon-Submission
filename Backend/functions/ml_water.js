const fs = require('fs');
const skmeans = require('skmeans');

function convertDataToArray(dataObj) {
  const dataArray = [];
  for (const key in dataObj) {
    const siteData = dataObj[key];
    siteData.siteID = key;
    dataArray.push(siteData);
  }

  console.log('Converted data array:', dataArray); // Debugging line
  return dataArray;
}

function preprocessData(data, targetMinMax) {
  return data.map((d, index) => {
    const processedData = { ...d };
    for (const key in processedData) {
      if (typeof processedData[key] === 'string' && !isNaN(parseFloat(processedData[key]))) {
        processedData[key] = parseFloat(processedData[key]);
      }
    }

    for (const key in targetMinMax) {
      if (key in processedData && processedData[key] !== null && processedData[key] !== '') {
        const minMax = targetMinMax[key];
        processedData[key] = (processedData[key] - minMax.min) / (minMax.max - minMax.min);
        if (isNaN(processedData[key])) {
          console.log(`Issue with data at site index ${index} for key "${key}":`, d[key]);
        }
      }
    }

    return processedData;
  });
}

function customWeightedDistance(a, b, targetMinMax) {
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== '' && b[i] !== '') {
      const key = targetMinMaxKeys[i];
      const target = targetMinMax[key].target || 0;
      const weight = Math.abs(target - a[i]);
      const sigmoidWeight = sigmoid(10 * (weight - 0.5));
      sum += Math.pow(sigmoidWeight * (a[i] - b[i]), 2);
    }
  }
  return Math.sqrt(sum);
}

function countDefinedCharacteristics(siteData, featureList) {
  let count = 0;
  featureList.forEach((key) => {
    if (siteData[key] !== '' && siteData[key] !== null) {
      count++;
    }
  });
  return count;
}

async function main() {
  const rawData = require('./Data/combinedData.json');
  const targetMinMax = require('./Data/targetMinMax.json');

  const dataArray = convertDataToArray(rawData);
  console.log('Data array length:', dataArray.length); // Debugging line
  const preprocessedData = preprocessData(dataArray, targetMinMax);
  console.log('Preprocessed data:', preprocessedData); // Debugging line


  const targetMinMaxKeys = Object.keys(targetMinMax).filter((key) => key !== 'Latitude' && key !== 'Longitude');
  const featureList = Object.keys(preprocessedData[0]).filter((key) => key !== 'siteID' && key !== 'Latitude' && key !== 'Longitude');
  const featureData = preprocessedData.map((d) => featureList.map((key) => d[key]));

  const kmeans = skmeans(featureData, 10, 'kmrand', {
    iterations: 100,
    distance: (a, b) => customWeightedDistance(a, b, targetMinMax),
  });

  console.log('K-means clusters:', kmeans.clusters); // Debugging line


  const siteScores = kmeans.idxs.map((clusterIdx) => Math.floor((1 - clusterIdx / 9) * 10));

  const siteResults = dataArray.map((site, idx) => {
    const definedCharacteristicsCount = countDefinedCharacteristics(site, featureList);
    return {
      siteID: site.siteID,
      score: definedCharacteristicsCount >= 3 ? siteScores[idx] : 0,
    };
  });

  console.log('Results:', siteResults);

  // Update combinedData.json with the healthiness score
  siteResults.forEach((result) => {
    rawData[result.siteID].healthinessScore = result.score;
  });

  fs.writeFileSync('./Data/combinedData.json', JSON.stringify(rawData, null, 2));
}

main();
