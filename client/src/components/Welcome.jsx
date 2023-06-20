import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Earth from "../assets/welcome_gif.gif";

export default function Welcome() {
  const [userName, setUserName] = useState("");
  useEffect(async () => {
    setUserName(
      await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      ).USER_NAME
    );
  }, []);
  return (
    <Container>
      <img src={Earth} alt="" />
      <h1>
        Welcome, <span>{userName}!</span>
      </h1>
      <h3>Please select a chat to Start messaging or Post something on feed.</h3>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  flex-direction: column;
  background-color: black;

  img {
    height: 20rem;
  }
  span {
    color: #4e0eff;
  }
`;
