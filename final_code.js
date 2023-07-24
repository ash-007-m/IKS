const axios = require('axios');
const fs = require('fs');
const csvParser = require('csv-parser');

const api = 'advanced_panchang';
const userId = '624879'; // Replace '624879' with your actual User ID
const apiKey = '39f6416f422096f4dadfbd0bbd59e5d5'; // Replace '39f6416f422096f4dadfbd0bbd59e5d5' with your actual API Key
const apiBaseUrl = 'https://json.astrologyapi.com/v1/';

// Function to format the date for the API request
function formatDateForAPI(date) {
  const dateParts = date.split('-');
  if (dateParts.length === 3) {
    const [month, day, year] = dateParts;
    return {
      day: parseInt(day, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      hour: 0,
      min: 0,
      lat: 23.25, 
      lon: 77.41, 
      tzone: 5.5, 
    };
  }
  return null;
}

// Function to make the API call and fetch advanced panchang data for a date
async function getAdvancedPanchang(date) {
  const auth = 'Basic ' + Buffer.from(userId + ':' + apiKey).toString('base64');
  const apiUrl = apiBaseUrl + api;

  const formattedDate = formatDateForAPI(date);
  //  console.log(formattedDate)
  if (!formattedDate) {
    console.error('Invalid date format.');
    return null;
  }

  try {
    const response = await axios.post(apiUrl, formattedDate, {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      timeout: 300000, 
    });
    //console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error fetching advanced panchang data:', error.message);
    return null;
  }
}

// Function to read dates from CSV and fetch advanced panchang data for each date
async function processDatesFromCSV(filePath) {
  const promises = []; 
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', async (row) => {
        const date = row['Date(MM/DD/YYYY)'];
        if (date) {
          //console.log(date);
          const promise = getAdvancedPanchang(date);
          promises.push(promise);
          promise.then((panchangData) => {
            if (panchangData) {
              results.push({ date, panchangData });
            }
          });
        }
      })
      .on('end', () => {
        
        Promise.all(promises)
          .then(() => resolve(results))
          .catch((error) => reject(error));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

const formatValue = (value) => {
 
  if (typeof value === 'string') {
    return JSON.stringify(value.replace(/"/g, '""'));
  }
  return JSON.stringify(value);
};


// Function to escape a value for CSV and enclose in quotes if it contains a comma
function escapeAndEncloseInQuotes(value) {
  if (typeof value === 'string' && value.includes(',')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Function to write data to a CSV file
function writeDataToCSV(results, outputPath) {
  // Define the CSV header
  const header = 'Date,Day,Sunrise,Sunset,Moonrise,Moonset,Vedic Sunrise,Vedic Sunset,Tithi Name,Tithi Special,Tithi Summary,Tithi Deity,' +
    'Nakshatra Name,Nakshatra Ruler,Nakshatra Deity,Nakshatra Special,Nakshatra Summary,Yog Name,Yog Special,Yog Meaning,' +
    'Karan Name,Karan Special,Hindu Maah Purnimanta,Hindu Maah Amanta,Paksha,Ritu,Sun Sign,Moon Sign,Ayana,Panchang Yog,' +
    'Vikram Samvat,Shaka Samvat,Vikram Samvat Name,Shaka Samvat Name,Disha Shool,Disha Shool Remedies,Nak Shool Direction,Nak Shool Remedies,' +
    'Moon Nivas,Abhijit Muhurta Start,Abhijit Muhurta End,Rahukaal Start,Rahukaal End,GuliKaal Start,GuliKaal End,Yamghant Kaal Start,Yamghant Kaal End\n';

  // Combine header and formattedData into a single string
  const csvContent = header + results.map(({ date, panchangData }) => {
    // Format the data for each row in the CSV
    // Replace the placeholders below with the actual properties from the panchangData object
    return `${escapeAndEncloseInQuotes(date)},${escapeAndEncloseInQuotes(panchangData.day)},${escapeAndEncloseInQuotes(panchangData.sunrise)},${escapeAndEncloseInQuotes(panchangData.sunset)},${escapeAndEncloseInQuotes(panchangData.moonrise)},${escapeAndEncloseInQuotes(panchangData.moonset)},${escapeAndEncloseInQuotes(panchangData.vedic_sunrise)},${escapeAndEncloseInQuotes(panchangData.vedic_sunset)},` +
      `${escapeAndEncloseInQuotes(panchangData.tithi?.details?.tithi_name || 'NA')},${escapeAndEncloseInQuotes(panchangData.tithi?.details?.special || 'NA')},${escapeAndEncloseInQuotes(panchangData.tithi?.details?.summary || 'NA')},${escapeAndEncloseInQuotes(panchangData.tithi?.details?.deity || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.nakshatra?.details?.nak_name || 'NA')},${escapeAndEncloseInQuotes(panchangData.nakshatra?.details?.ruler || 'NA')},${escapeAndEncloseInQuotes(panchangData.nakshatra?.details?.deity || 'NA')},${escapeAndEncloseInQuotes(panchangData.nakshatra?.details?.special || 'NA')},${escapeAndEncloseInQuotes(panchangData.nakshatra?.details?.summary || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.yog?.details?.yog_name || 'NA')},${escapeAndEncloseInQuotes(panchangData.yog?.details?.special || 'NA')},${escapeAndEncloseInQuotes(panchangData.yog?.details?.meaning || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.karan?.details?.karan_name || 'NA')},${escapeAndEncloseInQuotes(panchangData.karan?.details?.special || 'NA')},${escapeAndEncloseInQuotes(panchangData.hindu_maah?.purnimanta || 'NA')},${escapeAndEncloseInQuotes(panchangData.hindu_maah?.amanta || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.paksha || 'NA')},${escapeAndEncloseInQuotes(panchangData.ritu || 'NA')},${escapeAndEncloseInQuotes(panchangData.sun_sign || 'NA')},${escapeAndEncloseInQuotes(panchangData.moon_sign || 'NA')},${escapeAndEncloseInQuotes(panchangData.ayana || 'NA')},${escapeAndEncloseInQuotes(panchangData.panchang_yog || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.vikram_samvat || 'NA')},${escapeAndEncloseInQuotes(panchangData.shaka_samvat || 'NA')},${escapeAndEncloseInQuotes(panchangData.vkram_samvat_name || 'NA')},${escapeAndEncloseInQuotes(panchangData.shaka_samvat_name || 'NA')},${escapeAndEncloseInQuotes(panchangData.disha_shool || 'NA')},${escapeAndEncloseInQuotes(panchangData.disha_shool_remedies || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.nak_shool?.direction || 'NA')},${escapeAndEncloseInQuotes(panchangData.nak_shool?.remedies || 'NA')},${escapeAndEncloseInQuotes(panchangData.moon_nivas || 'NA')},${escapeAndEncloseInQuotes(panchangData.abhijit_muhurta?.start || 'NA')},${escapeAndEncloseInQuotes(panchangData.abhijit_muhurta?.end || 'NA')},` +
      `${escapeAndEncloseInQuotes(panchangData.rahukaal?.start || 'NA')},${escapeAndEncloseInQuotes(panchangData.rahukaal?.end || 'NA')},${escapeAndEncloseInQuotes(panchangData.guliKaal?.start || 'NA')},${escapeAndEncloseInQuotes(panchangData.guliKaal?.end || 'NA')},${escapeAndEncloseInQuotes(panchangData.yamghant_kaal?.start || 'NA')},${escapeAndEncloseInQuotes(panchangData.yamghant_kaal?.end || 'NA')}`;
    }).join('\n');

  // Write the CSV file
  fs.writeFile(outputPath, csvContent, (err) => {
    if (err) {
      console.error('Error saving CSV file:', err.message);
    } else {
      console.log('CSV file saved:', outputPath);
    }
  });
}

// Call the function to read dates from CSV and fetch advanced panchang data
const csvFilePath = 'final.csv'; // Replace with the actual path to your CSV file
processDatesFromCSV(csvFilePath)
  .then((results) => {
    //console.log(results)
    const outputPath = 'converted_data.csv';
    writeDataToCSV(results, outputPath);
  })
  .catch((error) => {
    console.error('Error processing data:', error.message);
  });
