const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors')
const rateLimit = require('express-rate-limit');
const options = {
  origin: 'http://localhost:4200',
//   methods: ['GET', 'POST'], // Add more HTTP methods if needed
};
const limiter = rateLimit({
    windowMs: 15 * 1000, // 15 seconds
    max: 4, // limit each IP to 1 requests per windowMs
    message: "Too many requests, please try again later."
});



const app = express();
app.use(express.json())
app.use(cors(options))
// Apply the limiter to all requests
app.use(limiter);


const db = new sqlite3.Database('chatdb');

const createTableSql = `
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        killed INTEGER DEFAULT 0,
        attempt INTEGER
    );
    `;

// Execute the SQL statement to create the table
db.run(createTableSql, (err) => {
    if (err) {
        return console.error('Error creating table:', err.message);
    }
    console.log('Table created successfully');
});


//get all posted messages
app.get('/message', (req, res) => {
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

//set the message
app.post('/message', (req, res) => {
  let message = req.body.message;
  let name = req.body.name
  db.run('INSERT INTO messages (name, message, killed, attempt) VALUES (?,?,?,?)', [name, message,0,0], function(result,err) {
    if(err == null){
        res.status(200).json({success : true});
    }else{
        res.status(500).json({success:false})
    }
  });
})


//get all username
app.get('/kill', (req, res) => {
    let id = req.query.id
    let chance = Math.trunc(Math.random()*10)
    //kill it
    if(chance >= 8){
        db.run('UPDATE messages SET killed = 1 where id = ?', [id], function(r,err) {
            if(err == null){
                res.status(200).json({killed : true})
            }
            console.log(err)
        });
    }
    else //increment the kill attempt
    {
        db.run('UPDATE messages SET attempt = attempt + 1 where id = ?', [id], function(r,err) {
            if(err == null){
                res.status(200).json({killed : false})
            }
            console.log(err)
        });
    }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
