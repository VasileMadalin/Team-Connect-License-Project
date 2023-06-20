import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Workspace from "../components/Workspace";
import Welcome from "../components/Welcome";
import TeamManagement from "../components/TeamManagement";
import AdvPanel from "../components/AdvPanel";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [manageTeam, setManageTeam] = useState(undefined);
  const [selectedChat, setSelectedChat] = useState(undefined);

  /*
  const socketX = new WebSocket('ws://localhost:8080');

  socketX.onopen = function() {
    console.log('Connected to WebSocket server');
  };

  socketX.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received message:', data);

    window.location.reload();

    // TODO: implement logic to handle updates received from the server
  };
  */

  useEffect(async () => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/login");
    } else {
      setCurrentUser(
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )
      );
    }
  }, []);
  useEffect(async () => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser.USER_ID);
      setManageTeam(1);   
      
      if (currentUser.sendNotification === true) {
        // trimit
        console.log("test again");
        let msg = "other";
        let flag = "alert";

        const data = await axios.get(`${allUsersRoute}/${currentUser.USER_ID}`);

        for (let elem in data.data) {
          socket.current.emit("send-msg", {
              to: parseInt(data.data[elem].USER_ID),
              from: parseInt(currentUser.USER_ID),
              msg,
              flag
          });
        }
      }
    }
  }, [currentUser]);

  useEffect(async () => {
    console.log("test", currentUser);

    if (currentUser) {
      
      console.log("test", currentUser);

      if (currentUser.isAvatarImageSet) {
        console.log("abcdefgh");
        const data = await axios.get(`${allUsersRoute}/${currentUser.USER_ID}`);
        console.log("test", data);
        setContacts(data.data);

        if (currentUser.sendNotification === true) {
          // trimit
          console.log("test again");
          let msg = "other";
          let flag = "alert";

          for (let elem in contacts) {
              socket.current.emit("send-msg", {
                to: parseInt(contacts[elem].USER_ID),
                from: parseInt(currentUser.USER_ID),
                msg,
                flag
              });
          }

          const user = await JSON.parse(
            localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
          );

          user.sendNotification = false;

          localStorage.setItem(
            process.env.REACT_APP_LOCALHOST_KEY,
            JSON.stringify(user)
          );

          setCurrentUser(
            await JSON.parse(
              localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
            )
          );
        }
      } else {
        navigate("/setAvatar");
      }
    }
  }, [currentUser]);
  const handleChatChange = (chat) => {
    localStorage.removeItem('currentChat');
    setCurrentChat(chat);
  };

  const handleManageTeam = (manageTeam) => {
    setManageTeam(manageTeam);
    console.log("oare oare", manageTeam);
  };

  const handleSelectedChat = (selectedChat) => {
    setSelectedChat(selectedChat);
  };

  return (
    <>
      <Container>
        <div className="container">
          <Workspace contacts={contacts} changeChat={handleChatChange} selectedChat={handleSelectedChat} goToManageTeam={handleManageTeam} socket={socket}/>
          
          {manageTeam === 1 ?
          (currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer currentChat={currentChat} selectedChat={selectedChat} socket={socket} />
          )) : (<TeamManagement socket={socket} />) }
            
            <AdvPanel contacts = {contacts} />
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #4682b4;
  .container {
    height: 100vh;
    width: 100vw;
    
    display: grid;
    grid-template-columns: 25% 45% 30%;

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
