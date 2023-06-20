import React, { useState, useEffect } from "react";
import styled from "styled-components";
import refreshButton from "../assets/button-refresh.png";

import { getAllNews } from "../utils/APIRoutes";
import { postNewsFeed } from "../utils/APIRoutes";


import axios from "axios";
import AdvInput from "./AdvInput";
import DateTimeDisplay from "./Date";

export default function AdvPanel({contacts}) {
  const [news, setNews] = useState([]);
  const [currentIdOrganization, setCurrentIdOrganization] = useState(undefined);

  

  useEffect(async () => {


    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    setCurrentIdOrganization(data.ORGANIZATION_ID);

    // un request care ia anunturile din baza de date

    const response = await axios.post(getAllNews, {

    });

    

    console.log("news", response.data);

    setNews(response.data);

    console.log("news", news);

  }, []);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    // adaug in array-ul current si in baza de date

    console.log(msg);

    await axios.post(postNewsFeed, {
      user_id: data.USER_ID,
      news_text: msg,
    });

    const response = await axios.post(getAllNews, {

    });

    console.log("news", response.data);

    setNews(response.data);

  };

  const refreshAdvPanel = async () => {

    const response = await axios.post(getAllNews, {});

    console.log("news", response.data);

    setNews(response.data);
  };

  return (
    <>
        <Container>

        <div className="newsEditor">

            <div className = "refresh-button"
              onClick={() => refreshAdvPanel()} >
                <div className = "image-preview">
                <img src = {refreshButton} alt="" />    
                </div>
            </div>

              <AdvInput handleSendMsg = {handleSendMsg} />

         </div>
            
          <div className="news">
            {news.map((contact, index) => {
              return (
                contact.ORGANIZATION_ID === currentIdOrganization ?(
                  <div className="contact">
                    
                    <div className="newsDetails">

                      <h6>{contact.FIRST_NAME + " " + contact.LAST_NAME}</h6>
                      <DateTimeDisplay dateTime={contact.NEWS_DATE} />
                    </div>

                    <div className="newsText">
                      {contact.NEWS_TEXT}
                    </div>
                    
                  </div>
                
              ): undefined);
            })}
          </div>

        </Container>
      
    </>
  );
}
const Container = styled.div`
  display: grid;
  grid-template-rows: 35% 65%;
  justify-content: center;
    
  overflow: hidden;
  background-color: #f8f8ff;
  .news {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: black;
        width: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      width: 90%;
      padding: 0.4rem;
      gap: 1rem;

      border-top: 2px solid black;

      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }

    .newsText {
      word-wrap: break-word;
    }
    .selected {
      background-color: #9a86f3;
    }
    .unReadMessages {
      background-color: red;
    }
    .image-preview {
      background-color: white;
      border-radius: 50%;
      overflow: hidden;
      width: 50px;
      height: 4rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    } 
  }
  .newsEditor {
    background-color: #f8f8ff;
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 2rem;
    .image-preview {
      background-color: white;
      border-radius: 50%;
      overflow: hidden;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .refresh-button {
      border: 0.4rem solid transparent;
      padding: 0.4rem;
      border-radius: 5rem;
      cursor: pointer;
      margin-left: 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.5s ease-in-out;
      img {
        height: 6rem;
        transition: 0.5s ease-in-out;
      }
    }
    .selected_good {
      background-color: green;
    }
    .selected_wrong {
      background-color: red;
    }
    
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;