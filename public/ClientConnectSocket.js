  const socket = io("http://localhost:150");
  var allChatsData = []; // Khai báo biến allChatsData ở đây
  const friendList = document.getElementById('friendList');
  const userInfor = document.getElementById('userName');
  const userImg = document.getElementById('userImg');
  const chatBox = document.getElementById('chatBox');
  const messageInput = document.getElementById('messageInput');
  const nameFriendActive = document.getElementById('nameFriendActive');
  const imgFriendActive = document.getElementById('imgFriendActive');
  const searchFriendInput = document.getElementById('searchFriendInput');
  var userName;

  userImg.src = '6.jpg';
  imgFriendActive.src = '6.jpg';
  socket.on("userInfor", (data) => {
    userName = data;
    userInfor.innerHTML = userName;
  });

    // Xử lý sự kiện khi nhận được tin nhắn từ máy chủ
   
    socket.on("loaddatachat", (data) => {
      allChatsData.push(data);
    });
    socket.on("loadlistfriend", (data) => {
      AddFriendToList(data.friend_id);
    });
    socket.on("checkishavefriend",(data)=>{

      if(data == true)
      {
       
        AddFriendToList(searchFriendInput.value.trim());
      }
      else
      {
        alert("Tên bạn bè không tồn tại ! ");
      }
    });
    socket.on("receivemessage", (data) => {
      allChatsData.push(data)
      console.log("Data received:", data);

      if (nameFriendActive && nameFriendActive.innerHTML == data.user1_name ) 
      {
          appendMessage("friend_msg", data.content, data.time);
      } 
      else 
      { 
          const blockFriends = friendList.querySelectorAll('.block');
          let isHaveThisFriend = false;
          blockFriends.forEach(blockElement => {
              const friendName = blockElement.querySelector('#nameFriend');
              if (friendName.textContent == data.user1_name) {
                  // alert("true"); // Sử dụng console.log để kiểm tra xem điều kiện có được thỏa mãn không
                  isHaveThisFriend = true;
                  AddElementToFriendHaveMessage(blockElement,data.content);
                }
          });
          console.log(isHaveThisFriend);
          if(isHaveThisFriend==false)
          {
              AddFriendToList(data.user1_name,(callBack)=>{
              AddElementToFriendHaveMessage(callBack,data.content);
            });
          }

      }
    });
  function AddElementToFriendHaveMessage(blockFriend, message) {
      var detailsDiv = blockFriend.querySelector('.details');
      var messageDiv = document.createElement('div');
      messageDiv.classList.add('message_p');
      var messageP = document.createElement('p');
      messageP.textContent = message; 
      var icon = document.createElement('b');
      icon.textContent = '!'; 
      messageDiv.appendChild(messageP);
      messageDiv.appendChild(icon);
      detailsDiv.appendChild(messageDiv);
  }
  function AddFriendToList(nameFriend,callBack)
  {
    const friend = document.createElement('div');
    friend.classList.add('block');

    const avatar = document.createElement('div');
    avatar.classList.add('imgBox');
    const imgAvatar = document.createElement('img');
    imgAvatar.classList.add('cover');
    imgAvatar.src = '6.jpg'; 
    avatar.appendChild(imgAvatar);
    friend.appendChild(avatar);

    const details = document.createElement('div');
    details.classList.add('details', 'listHead');
    const name = document.createElement('h4');
    name.id = 'nameFriend';
    name.textContent = nameFriend;
    details.appendChild(name);

    friend.appendChild(details);


    
    friendList.appendChild(friend);
    
    callBack(friend);
  }
  
    // thêm sự kiện khi click vào bạn bè
    friendList.addEventListener('click', function(event) {
      var currentClickedFriend;
      currentClickedFriend = event.target
      const blockElement = currentClickedFriend.closest('.block');
      if (blockElement) {
        // Xóa lớp active từ tất cả bạn bè
        const blockFriends = friendList.querySelectorAll('.block');
        blockFriends.forEach(friend => {

            friend.classList.remove('active');


          });
        // Thêm lớp active vào bạn bè được click
        blockElement.classList.add('active');
        const friendName = blockElement.querySelector('#nameFriend');
        nameFriendActive.innerHTML = friendName.textContent;
        displayChat(friendName.textContent);
        var notification = blockElement.querySelector('.message_p');
        notification.remove();
        
  
      }
    });
  
    // Hiển thị trò chuyện với bạn bè đã chọn
    function displayChat(friend) {
        // Clear trò chuyện trước đó
      messageInput.value = '';
      chatBox.innerHTML = '';
      allChatsData.forEach(element => {
        if(element.user1_name == friend || element.user2_name == friend)
        {
          if(element.user1_name == userName)
            {
              appendMessage("my_msg",element.content,element.time);
            }
            else
            {
              appendMessage("friend_msg",element.content,element.time);
    
            }
        }
      
      });
    }
   
  
   
  
      function SendMessage(event) { // sử kiện gửi tin nhắn khi bấm submit 
      event.preventDefault(); // Hàm này ngăn chặn hành động mặc định của form khi được submit tức là trang không bị tải lại
      const message = messageInput.value.trim();
      if (message !== '') {
          const options = {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false // Đặt giá trị này là false để hiển thị theo định dạng 24 giờ
          };
          time = new Date().toLocaleTimeString([], options);
          const jsonObject = {
              user1_name: userName,
              user2_name: nameFriendActive.innerHTML,
              content: message,
              time: time,
          };
          appendMessage('my_msg', message,time);
          socket.emit('sendmessage', jsonObject);
          messageInput.value = '';
      }
    }
    messageInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
          SendMessage(event);
      }
    });
    
  
    function appendMessage(className, message , time) {
      
        const messageElement = document.createElement('div');
        messageElement.classList.add('message',className);
        messageElement.innerHTML = `
          <p> ${message} <br><span>${time}</span></p>
        `;
      chatBox.appendChild(messageElement);
      chatBox.scrollTop = chatBox.scrollHeight;
    }


    function EventClickSearch() {
      // Lấy tất cả các phần tử con của friendList có class 'nameFriend'
      const friendsArray = Array.from(friendList.getElementsByClassName('nameFriend'));

      // kiểm tra xem người bạn này đã tồn tại trong danh sách bạn bè chưa
      const userExists = friendsArray.some(friend => friend.textContent.trim() === searchFriendInput.value.trim());
      if (userExists) {
          console.log(`Người dùng đã tồn tại trong danh sách bạn bè.`);
      } else {
          const jsonObject = {
              friend_id: searchFriendInput.value.trim(),
              userName: userName
          };
          socket.emit("searchfriend", jsonObject);
      }
    }
    searchFriendInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            EventClickSearch();
        }
    });

