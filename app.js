const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const Student = require("./student");
require("dotenv").config();

const PORT = 3000;
const API_KEY = process.env.API_KEY;

function getStudentData() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "student.json");

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading student.json:", err);
        return reject(err);
      }

      try {
        const studentData = JSON.parse(data);
        const student = Student.fromJSON(studentData);
        console.info("Student:", student);
        resolve(student);
      } catch (parseErr) {
        console.error("Error parsing student.json:", parseErr);
        reject(parseErr);
      }
    });
  });
}

let student = null;
getStudentData()
  .then((loadedStudent) => {
    student = loadedStudent;
    console.log("Student data loaded successfully");
  })
  .catch((error) => {
    console.error("Failed to load student data:", error);
  });

const server = http.createServer((req, res) => {
  console.log(`Request URL: ${req.url}`);
  if (req.url === "/" || req.url === "/index.html") {
    const filePath = path.join(__dirname, "pages", "index.html");

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error: ${err.code}`);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content, "utf-8");
      }
    });
  } else if (req.url.startsWith("/student")) {
    const studentParam = req.url.split("/")[2];
    if (studentParam !== student.login) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Student not found");
    } else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(student.toHtml(), "utf-8");
    }
  } else if (req.url.startsWith("/api/commodity")) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const productName = urlObj.searchParams.get("name");

    if (!productName) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Product name is required" }));
      return;
    }

    const apiOptions = {
      hostname: "api.api-ninjas.com",
      path: `/v1/commodityprice?name=${encodeURIComponent(productName)}`,
      method: "GET",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
      },
    };

    const apiReq = https.request(apiOptions, (apiRes) => {
      let data = "";

      console.log(`API Response Status: ${apiRes.statusCode}`);

      apiRes.on("data", (chunk) => {
        data += chunk;
      });

      apiRes.on("end", () => {
        console.log(`API response data: ${data}`);

        res.writeHead(apiRes.statusCode, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });

        try {
          const parsedData = JSON.parse(data);

          if (Array.isArray(parsedData) && parsedData.length === 0) {
            console.log("API returned empty array, sending helpful message");
            res.end(JSON.stringify([]));
          } else {
            res.end(JSON.stringify(parsedData));
          }
        } catch (e) {
          console.log(`Error parsing API response: ${e.message}`);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid response from API" }));
        }
      });
    });

    apiReq.on("error", (error) => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    });

    apiReq.end();
  } else {
    res.writeHead(404);
    res.end("Page not found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
