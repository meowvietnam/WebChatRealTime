const mysql = require('mysql');
const connection = mysql.createConnection({

    

    host: "localhost",
    user: "root",
    password: null,
    database: "chatrealtime"
    

});
connection.connect((err)=>{
    if(err)
    {
        console.error(err);
    }
    else
    {
        console.log("connected mysql ok");
    }

});
module.exports = connection;