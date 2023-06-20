import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, selectedChat, socket }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [impID, setImpID] = useState(undefined);
  // let impID;

  useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    const response = await axios.post(recieveMessageRoute, {
      from: data.USER_ID,
      to: currentChat.USER_ID,
    });


    console.log("mesaj");

    setMessages(response.data);
    // setImpID(currentChat.USER_ID);

    // console.log("test", currentChat.USER_ID);
    setImpID(currentChat.USER_ID);

    // console.log("imp", impID);


  }, [currentChat, impID]);

  
  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        ).USER_ID;
      }
    };
    getCurrentChat();
  }, [currentChat, impID]);
  

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    // msg = msg + " " + (data.USER_ID).toString();

    socket.current.emit("send-msg", {
      to: currentChat.USER_ID,
      from: data.USER_ID,
      msg
    });

    console.log("test", msg);

    await axios.post(sendMessageRoute, {
      from: data.USER_ID,
      to: currentChat.USER_ID,
      message: msg,
    });

    const msgs = [...messages];
    msgs.push({ fromSelf: true, MESSAGE: msg });
    setMessages(msgs);
  };

  useEffect(() => {
    /*
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        ).USER_ID;
      }
    };
    getCurrentChat();
    */
    if (socket.current) {
      socket.current.on("msg-recieve", (data) => {

        // console.log("test", data.from);

        // console.log("test", currentChat.USER_ID);

        // console.log("test", impID);

        // foarte important, nu trebuie modificat
        // console.log("test", data);
        if (data.flag !== "alert") {
          setImpID(data.from);
          
          setArrivalMessage({ fromSelf: false, MESSAGE: data.msg });
        }
        //}
      });
    }
  }, []);

  useEffect(() => {
    // aici currentChat este ok
    console.log("test", currentChat.USER_ID); // cel deschis
    console.log("test1", impID); // de la ce vine

    currentChat.USER_ID === impID && arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">

          <div className = {`${currentChat.AVATAR_IMAGE.startsWith("data:image/jpeg;base64") ? "image-preview" : "avatar"}`}>
              <img
                src={`${currentChat.AVATAR_IMAGE.startsWith("data:image/jpeg;base64") ? currentChat.AVATAR_IMAGE : "data:image/svg+xml;base64," + currentChat.AVATAR_IMAGE}`}
                alt=""
              />
          </div>

          <div className="username">
            <h3>{currentChat.FIRST_NAME + " " + currentChat.LAST_NAME}</h3>
          </div>
        </div>

      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content ">
                  <p>{message.MESSAGE}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .image-preview {
    background-color: white;
    border-radius: 50%;
    overflow: hidden;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          border-radius: 50%;
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;