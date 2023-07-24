const express = require('express');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios');
const multer = require('multer');
const axiosRetry = require('axios-retry');

const app = express();
const port = 3000;

const api = 'advanced_panchang';
const userId = '624879'; // Replace '624879' with your actual User ID
const apiKey = '39f6416f422096f4dadfbd0bbd59e5d5'; // Replace '39f6416f422096f4dadfbd0bbd59e5d5' with your actual API Key
const apiBaseUrl = 'https://json.astrologyapi.com/v1/';

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Configure axios to retry with exponential backoff on errors and set a longer timeout
axiosRetry(axios, {
  retries: 3, // Number of retries
  retryDelay: (retryCount) => Math.pow(2, retryCount - 1) * 1000, // Exponential backoff delay between retries (in ms)
});

function formatDateForAPI(date) {
  const dateParts = date.split(/[/-]/);
  if (dateParts.length === 3) {
    const [month, day, year] = dateParts;
    return {
      day: parseInt(day, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      hour: 0,
      min: 0,
      lat: 0, // Replace 0 with your default latitude value if not available in the CSV
      lon: 0, // Replace 0 with your default longitude value if not available in the CSV
      tzone: 5.5, // Replace 5.5 with your default timezone value if not available in the CSV
    };
  }
  return null;
}

async function convertDate(date) {
  const auth = "Basic " + Buffer.from(userId + ":" + apiKey).toString("base64");
  const apiUrl = apiBaseUrl + api;

  try {
    const response = await axios.post(apiUrl, date, {
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // Increase the timeout to 30 seconds (adjust if needed)
    });

    return response.data;
  } catch (error) {
    console.error('Error converting date:', error.message);
    return null; // Return null for API errors
  }
}

// ... (previous code)

// Function to format API response data for CSV
function formatApiResponseData(data) {
  const formatValue = (value) => {
    // Stringify the value and handle special characters and line breaks
    if (typeof value === 'string') {
      return JSON.stringify(value.replace(/"/g, '""'));
    }
    return JSON.stringify(value);
  };

  // (Replace the placeholders for column names with actual headers)
  return `Input Date,Day,Sunrise,Sunset,Moonrise,Moonset,Vedic Sunrise,Vedic Sunset,Tithi Name,Tithi Special,Tithi Summary,Tithi Deity,` +
    `Nakshatra Name,Nakshatra Ruler,Nakshatra Deity,Nakshatra Special,Nakshatra Summary,Yog Name,Yog Special,Yog Meaning,` +
    `Karan Name,Karan Special,Hindu Maah Purnimanta,Hindu Maah Amanta,Paksha,Ritu,Sun Sign,Moon Sign,Ayana,Panchang Yog,` +
    `Vikram Samvat,Shaka Samvat,Vikram Samvat Name,Shaka Samvat Name,Disha Shool,Disha Shool Remedies,Nak Shool Direction,Nak Shool Remedies,` +
    `Moon Nivas,Abhijit Muhurta Start,Abhijit Muhurta End,Rahukaal Start,Rahukaal End,GuliKaal Start,GuliKaal End,Yamghant Kaal Start,Yamghant Kaal End\n` +
    `${formatValue(data.inputDate)},${formatValue(data.day)},${formatValue(data.sunrise)},${formatValue(data.sunset)},${formatValue(data.moonrise)},${formatValue(data.moonset)},${formatValue(data.vedic_sunrise)},${formatValue(data.vedic_sunset)},` +
    `${formatValue(data.tithi?.details?.tithi_name || '')},${formatValue(data.tithi?.details?.special || '')},${formatValue(data.tithi?.details?.summary || '')},${formatValue(data.tithi?.details?.deity || '')},` +
    `${formatValue(data.nakshatra?.details?.nak_name || '')},${formatValue(data.nakshatra?.details?.ruler || '')},${formatValue(data.nakshatra?.details?.deity || '')},${formatValue(data.nakshatra?.details?.special || '')},${formatValue(data.nakshatra?.details?.summary || '')},` +
    `${formatValue(data.yog?.details?.yog_name || '')},${formatValue(data.yog?.details?.special || '')},${formatValue(data.yog?.details?.meaning || '')},` +
    `${formatValue(data.karan?.details?.karan_name || '')},${formatValue(data.karan?.details?.special || '')},${formatValue(data.hindu_maah?.purnimanta || '')},${formatValue(data.hindu_maah?.amanta || '')},` +
    `${formatValue(data.paksha || '')},${formatValue(data.ritu || '')},${formatValue(data.sun_sign || '')},${formatValue(data.moon_sign || '')},${formatValue(data.ayana || '')},${formatValue(data.panchang_yog || '')},` +
    `${formatValue(data.vikram_samvat || '')},${formatValue(data.shaka_samvat || '')},${formatValue(data.vkram_samvat_name || '')},${formatValue(data.shaka_samvat_name || '')},${formatValue(data.disha_shool || '')},${formatValue(data.disha_shool_remedies || '')},` +
    `${formatValue(data.nak_shool?.direction || '')},${formatValue(data.nak_shool?.remedies || '')},${formatValue(data.moon_nivas || '')},${formatValue(data.abhijit_muhurta?.start || '')},${formatValue(data.abhijit_muhurta?.end || '')},` +
    `${formatValue(data.rahukaal?.start || '')},${formatValue(data.rahukaal?.end || '')},${formatValue(data.guliKaal?.start || '')},${formatValue(data.guliKaal?.end || '')},${formatValue(data.yamghant_kaal?.start || '')},${formatValue(data.yamghant_kaal?.end || '')}`;
}

// ... (remaining code)

const results = [];
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
// ... (previous code)

// Save the results to a new JSON file
const outputPathJSON = 'converted_data.json';

// ... (remaining code)


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.post('/convert', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    fs.createReadStream(file.path)
      .pipe(csvParser())
      .on('data', async (row) => {
        const date = row['Date(MM/DD/YYYY)'] || row['Date(MM-DD-YY)'];
        if (date) {
          try {
            const convertedDate = await convertDate(formatDateForAPI(date));
            if (convertedDate) {
              const rowData = { inputDate: date, ...convertedDate };
             await results.push(convertedDate);
               console.log(results);
               await fs.writeFile(outputPathJSON, JSON.stringify(rowData, null, 2), (err) => {
                if (err) {
                  console.error('Error saving JSON file:', err.message);
                  res.status(500).json({ error: 'Error saving JSON file' });
                } else {
                  console.log('Conversion complete! Results saved to converted_data.json');
                  res.json({ results });
                }
              });
            
            }
          } catch (error) {
            // Handle errors during conversion
            console.error('Error processing date:', date, error.message);
          }
        }
      })
      .on('end', async () => {
        // Remove the temporary file after parsing is done
      //  await fs.unlinkSync(file.path);

        // Save the results to a new JSON file
      });
  } catch (error) {
    console.error('Error processing data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
