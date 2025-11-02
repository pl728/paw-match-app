/*
    SETUP
*/
var express = require('express');   // Express for the web server
var path = require('path');         // For file paths
var app = express();                // Create express app
PORT = 4516;                        // Port number

// Serve static images from the "pets" folder
app.use('/pets', express.static(path.join(__dirname, 'pets')));

/*
    ROUTES
*/
app.get('/', function (req, res) {
    // Send "Hello world!" and pet grid
    res.send(`
        <html>
          <head>
            <title>Paw Match</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f8f8f8;
                margin: 0;
                padding: 40px;
                text-align: center;
              }
              h1 {
                color: #333;
              }
              .grid {
                margin-top: 30px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
                justify-items: center;
              }
              .card {
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                overflow: hidden;
                text-align: center;
                width: 250px;
                transition: transform 0.2s ease;
              }
              .card:hover {
                transform: scale(1.03);
              }
              .card img {
                width: 100%;
                height: 200px;
                object-fit: cover;
              }
              .card h2 {
                margin: 10px 0 5px;
              }
              .card p {
                color: #555;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <h1>Paw Match</h1>
            <div class="grid">
              <div class="card">
                <img src="/pets/GoldenRetriever.jpg" alt="Golden Retriever">
                <h2>Max</h2>
                <p>Golden Retriever</p>
                <p>Age: 2 years</p>
              </div>
              <div class="card">
                <img src="/pets/Collie.jpg" alt="Collie">
                <h2>Larry</h2>
                <p>Boarder Collie</p>
                <p>Age: 3 years</p>
              </div>
              <div class="card">
                <img src="/pets/German.jpg" alt="German Shepherd">
                <h2>Max</h2>
                <p>German Shepherd</p>
                <p>Age: 4 years</p>
              </div>
            </div>
          </body>
        </html>
    `);
});

/*
    LISTENER
*/
app.listen(PORT, function () {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});
