const ipAddress = "localhost";
const port = 150;
const path = require("path");
const express = require("express");
const app = express();
//Khi bạn gửi một yêu cầu HTTP bằng POST bodyParser.urlencoded({ extended: true }) biến data thành json vào javascript để dùng 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Để chỉ sử dụng dữ liệu application/json1
app.use(express.static(path.join(__dirname,"public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/trangchu", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "trangchu.html"));
});
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const connection = require("./mysql");
server.listen(port,ipAddress,() => {

    console.log(`Server is listening on ${ipAddress}:${port}`);

});
var userName;

app.post("/auth", (req, res) => {
  console.log(req.body);
  // Xử lý logic trước khi render trang web
  CheckLogin(req.body.username,req.body.password,(err,isLoginSuccess)=>{
    if (err) {
      // Xử lý lỗi
      return;
    }
    console.log(isLoginSuccess);
    if(isLoginSuccess)
    {
      userName = req.body.username;
      res.redirect("/trangchu");
    }
    else
    {
      res.send(`
        <html>
          <body>
            <script>
              alert("Tài khoản hoặc mật khẩu sai!");
              window.location.href = "/";
            </script>
          </body>
        </html>
      `);
    }
  });
  

});


app.post("/register", (req, res) => {
  console.log(req.body);
  // Xử lý logic trước khi render trang web
  CheckRegister(req.body.username,(err,isRegister)=>{
    if (err) {
      // Xử lý lỗi
      return;
    }
    console.log(isRegister);
    if(isRegister)
    {
      Register(req.body.username,req.body.password);
      res.send(`
        <html>
          <body>
            <script>
              alert("Đăng kí thành công!");
              window.location.href = "/";
            </script>
          </body>
        </html>
      `);
    }
    else
    {
      res.send(`
        <html>
          <body>
            <script>
              alert("Tài khoản đã tồn tại!");
              window.location.href = "/";
            </script>
          </body>
        </html>
      `);
    }
  });
  

});
var userConnect = [];
io.on('connection', (socket) => {
  console.log("co nguoi ketnoi");
  socket.emit("userInfor",userName);
  var id = socket.id;
  userConnect.push({userName,id});
  console.log("co nguoi ketnoi",userConnect);

    // bất đồng bộ khi query xong no callback ra chatdata thì nó mới trả về giá trị sau đó mới socket.emit 
    LoadListFriend(userName, (err, listFriendData) => {
      if (err) {
        // Xử lý lỗi
        console.error("Error loading chat data:", err);
        return;
      }
      for(let i = 0; i < listFriendData.length;i++)
      {

          socket.emit("loadlistfriend", listFriendData[i]);
          LoadChatThenEmit(userName,listFriendData[i].friend_id);
      }
          
    });
function LoadChatThenEmit(userName,friend_id)
{
  LoadChatDataBase(userName ,friend_id , (err, chatData) => {
    if (err) {
      // Xử lý lỗi
      console.error("Error loading chat data:", err);
      return;
    }
    // đáng ra nên gửi 1 lần cả mảng các đoạn chat và xử lí json bên client thay vì gửi nhiều lần bằng vòng for ở server
    for(let j = 0; j < chatData.length;j++)
    {
       
        socket.emit("loaddatachat", chatData[j]);
        console.log(chatData[j]);
    }
        
  });
}
  // Load tin nhắn khi cần;

  // save message
  socket.on("sendmessage", (data) => {
          console.log(data);
         
          SaveMessage(data.user1_name,data.user2_name,data.content,data.time);
          console.log(data.user2_name);
          console.log(GetIdUserByName(data.user2_name));
          socket.to(GetIdUserByName(data.user2_name)).emit('receivemessage', data);

      });
  socket.on('disconnect',()=>{

    userConnect = userConnect.filter(item => item.id != socket.id); // loại bỏ người disconnect có socket.id khoải mảng userConnect
    console.log(userConnect);
  });
  socket.on('searchfriend',(data)=>{
    CheckDatabaseHaveThisFriend(data.friend_id,(err,isHaveFriend)=>{
      console.log(data);
      if (err) {
        // Xử lý lỗi
        return;
      }
      else
      {
        socket.emit("checkishavefriend",isHaveFriend);
        if(isHaveFriend)
        {
          SetFriendOnSql(data.userName,data.friend_id);
        }

      }

    });
 
  });


});

  

  
  function GetIdUserByName(userName)
  {
    for (let item of userConnect) {
      if (item.userName == userName) {
          return item.id;
      }
    }
    return null; // nếu không tìm thấy userName nào phù hợp
  }
  function CheckLogin(username,password,callback)
  {
    var query = "SELECT * FROM users WHERE username = ? && password = ?";
    connection.query(query, [username,password], (err, rows) => {
      if (err) {
        console.error("Error check login:", err);
        callback(err, null);
        return;
      }
      if(rows.length>0)
      {
        // login ok
        console.log(rows);
        callback(null,true);
      }
      else
      {
        callback(null,false);

      }

    });
  }
  function CheckRegister(username,callback)
  {
    var query = "SELECT * FROM users WHERE username = ?";
    connection.query(query, [username], (err, rows) => {
      if (err) {
        console.error("Error check login:", err);
        callback(err, null);
        return;
      }
      if(rows.length>0)
      {
        // tồn tại account rồi
        console.log(rows);
        callback(null,false);
      }
      else
      {
        callback(null,true);

      }

    });
  }
  
  function Register(userName , passWord)
  {
    var query = "INSERT INTO users (username, password) VALUES (?,?) ";
    connection.query(query, [userName,passWord], (err) => {
      if (err)
      {
        console.error("Error check login:", err);
        return;
      }
      else
      {
        console.error("insert thành công");
      }
    });
  }
  function CheckDatabaseHaveThisFriend(username,callback)
  {
    var query = "SELECT * FROM users WHERE username = ?";
    connection.query(query, [username], (err, rows) => {
      if (err) {
        console.error("Error check login:", err);
        callback(err, null);
        return;
      }
      if(rows.length>0)
      {
        console.log(rows);
        callback(null,true);
      }
      else
      {
        callback(null,false);

      }

    });
  }
  function LoadListFriend(myname, callback)
  {
    var query = "SELECT friend_id FROM friends WHERE user_id = ?";
    connection.query(query, [myname], (err, rows) => {
      if (err) {
        console.error("Error loading chat data:", err);
        callback(err, null);
      }
      callback(null,rows);
    });

  }
  function LoadChatDataBase(myName,myFriend, callback) {
    var query = "SELECT user1_name,user2_name,content,time FROM privatechathistory WHERE (user1_name = ? && user2_name =?) || user1_name = ? && user2_name =?";
    connection.query(query, [myName,myFriend , myFriend , myName], (err, rows) => {
      if (err) {
        console.error("Error loading chat data:", err);
        callback(err, null);
      }
      callback(null,rows);
    });

}
  function SaveMessage(myName,friendName,content,time)
  {
    var query = "Insert INTO privatechathistory(user1_name,user2_name,content,time) values(?,?,?,?)";
    connection.query(query, [myName,friendName,content,time], (err) => {
      if (err) {
        console.error("Error thêm chat data:", err);
        
      }
      else
      {
        console.log("update ok");

      }
      
    });
  }
  function SetFriendOnSql(myName,friendName)
  {
    var query = "Insert INTO friends(user_id,friend_id) values(?,?)";
    connection.query(query, [myName, friendName], (err) => {
      if (err) {
          console.error("Error thêm chat data:", err);
      } else {
          console.log("Insert 1 OK");

          // Thực hiện truy vấn thứ hai sau khi truy vấn đầu tiên hoàn thành
          connection.query(query, [friendName, myName], (err) => {
              if (err) {
                  console.error("Error thêm chat data:", err);
              } else {
                  console.log("Insert 2 OK");
              }
          });
      }
    });
  }
  

