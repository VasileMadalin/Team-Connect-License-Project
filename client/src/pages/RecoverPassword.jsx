import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { recoverPasswordRoute } from "../utils/APIRoutes";
import { changePasswordRoute } from "../utils/APIRoutes";

export default function RecoverPassword() {
  const navigate = useNavigate();
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };
  const [values, setValues] = useState({
    organizationAccessCode: '',
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [requestCode, setrequestCode] = useState(undefined);

  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  }, []);

  const handleChange = (event) => {
    console.log(event);
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const handleValidationAux = () => {
    const { RecoveryPasswordCode, password, confirmPassword} = values;
    if (password !== confirmPassword) {
      toast.error(
        "Password and confirm password should be same.",
        toastOptions
      );
      return false;
    }

    return true;
  };

  const handleValidationEmail = () => {
    const { email } = values;

    if (email === "") {
      toast.error("Email is required.", toastOptions);
      return false;
    }

    return true;
  };


  const handleSubmit = async (event) => {
    
    event.preventDefault();
    if (handleValidationEmail()) {
      const { email } = values;

      const { data } = await axios.post(recoverPasswordRoute, {
        email
      });

      if (data.status === false) {
        toast.error(data.msg, toastOptions);
      }
      if (data.status === true) {
        console.log(data);
        setrequestCode(1);
      }
    }
  };

  const handleSubmitAux = async (event) => {
    event.preventDefault();
    if (handleValidationAux()) {
      const { RecoveryPasswordCode, password, confirmPassword  } = values;

      const { data } = await axios.post(changePasswordRoute, {
        RecoveryPasswordCode,
        password,
        confirmPassword,
      });

      if (data.status === false) {
        toast.error(data.msg, toastOptions);
      }
      if (data.status === true) {
        toast.success(data.msg, toastOptions);
      }
    }
  };

  return (
    <>
      <FormContainer>
        <form action="" onSubmit={(event) => handleSubmit(event)}>
          <p> Complete the following form to receive a recovery code on your email </p>
          <input
            type="email"
            placeholder="Email"
            name="email"
            onChange={(e) => handleChange(e)}
          />
          <button type="submit"> Submit </button>
        </form>
        {
          requestCode === 1 ?
            (
            <form action="" onSubmit={(event) => handleSubmitAux(event)}>
              <p> Complete the following form to change the password </p>

              <input
                type="text"
                placeholder="Recovery Code"
                name="RecoveryPasswordCode"
                onChange={(e) => handleChange(e)}
              />
              <input
                type="password"
                placeholder="New password"
                name="password"
                onChange={(e) => handleChange(e)}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                name="confirmPassword"
                onChange={(e) => handleChange(e)}
              />
              <button type="submit"> Submit </button>
            </form>
            ) : (undefined)
        }
      <span style={{ color: 'black' }}>
        Go back to <Link to="/login">Login</Link> page
      </span>
      </FormContainer>
      <ToastContainer/>
    </>
  );
}

const FormContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #f8f8ff;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 5rem;
    }
    h1 {
      color: white;
      text-transform: uppercase;
    }
  }

  form {
    display: flex;
    width: 700px;
    flex-direction: column;
    gap: 2rem;
    background-color: #4682b4;
    border-radius: 2rem;
    padding: 3rem 5rem;
  }

  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid black;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    height: 10px;
    font-size: 1rem;
    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }
  }

  input::placeholder {
    color: black;
  }

  button {
    background-color: #f8f8ff;
    color: black;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    &:hover {
      background-color: #4e0eff;
    }
  }
  span {
    color: white;
    text-transform: uppercase;
    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
    }
  }
`;
