import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { inviteMemberRoute } from "../utils/APIRoutes";
import { allUsersInfo } from "../utils/APIRoutes";
import { allUsersMessages } from "../utils/APIRoutes";
import { allUsersReceivedMessages } from "../utils/APIRoutes";
import { allMessages } from "../utils/APIRoutes";
import { suspendUser } from "../utils/APIRoutes";
import { activateUser } from "../utils/APIRoutes";
import { allUsersStatus } from "../utils/APIRoutes";
import { allUsersGeneralInfo } from "../utils/APIRoutes";

import { useNavigate } from "react-router-dom";

export default function TeamManagement({ socket }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({ firstname: "", lastname: "", mail: "" });
  const [currentUser, setCurrentUser] = useState(undefined);
  const [outputMessage, setOutputMessage] = useState(undefined);
  const [outputMessageDeactivate, setOutputMessageDeactivate] = useState(undefined);
  const [outputMessageActivate, setOutputMessageActivate] = useState(undefined);
  const [inviteMenu, setInviteMenu] = useState(undefined);
  const [graph1, setGraph1] = useState(undefined);
  const [graph2, setGraph2] = useState(undefined);

  const [deactivate, setDeactivate] = useState(undefined);
  const [activate, setActivate] = useState(undefined);
  const [selectedOption, setSelectedOption] = useState('');
  const [choicesGraph1, setChoicesGraph1] = useState([]);
  const [choicesDeactivate, setChoicesDeactivate] = useState([]);
  const [choicesActivate, setChoicesActivate] = useState([]);
  const [choicesActivateAux, setChoicesActivateAux] = useState([]);
  const [choicesDeactivateAux, setChoicesDeactivateAux] = useState([]);


  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };

  useEffect(async () => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {

    } else {
      setCurrentUser(
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )
      );
    }

    setInviteMenu(0);
    setGraph1(0);

  }, []);

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const validateForm = () => {

    const { firstname, lastname, mail } = values;
    if (firstname === "") {
      toast.error("First Name, Last Name and Mail is required.", toastOptions);
      return false;
    } else if (lastname === "") {
      toast.error("First Name, Last Name and Mail is required.", toastOptions);
      return false;
    } else {
      if (mail === "") {
        toast.error("First Name, Last Name and Mail is required.", toastOptions);
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      const { firstname, lastname, mail } = values;
      const ownerId = currentUser.USER_ID;

      const { data } = await axios.post(inviteMemberRoute, {
        firstname,
        lastname,
        mail,
        ownerId
      }); 

      setOutputMessage(data.msg);

      // variabila ia un mesaj si il afisez intr-un div ceva
    }
  };

  async function handleSubmitGraph1(e) {
    e.preventDefault();
    console.log("oare merge", selectedOption);
    const response = await axios.post(allMessages, {
      from: selectedOption
    });
    let messages = response.data;
    console.log(messages);

    navigate("/graphic", { state: { messages } });
  }

  const handleSubmitDeactivate = async (e) => {
    e.preventDefault();    

    const dataX = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    const { data } = await axios.post(suspendUser, {
      userID: selectedOption
    });

    // console.log("test", data);
    if (data.status === true) {

      let msg = "same";

      console.log("roscata", selectedOption, dataX.USER_ID);
      // console.log(socket.current.emit);
      let flag = "alert";

      socket.current.emit("send-msg", {
        to: parseInt(selectedOption),
        from: dataX.USER_ID,
        msg,
        flag
      });

      msg = "other";

      for (let elem in choicesDeactivateAux) {
        if (parseInt(selectedOption) !== choicesDeactivateAux[elem].USER_ID) {
          socket.current.emit("send-msg", {
            to: parseInt(choicesDeactivateAux[elem].USER_ID),
            from: dataX.USER_ID,
            msg,
            flag
          });
        }
      }
    }
    
    setOutputMessageDeactivate(data.msg);
    console.log(outputMessageDeactivate);
  }

  async function handleSubmitActivate(e) {
    e.preventDefault();

    const dataX = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    const { data } = await axios.post(activateUser, {
      userID: selectedOption
    });

    if (data.status === true) {

      let msg = "same";

      console.log("test", selectedOption, dataX.USER_ID);
      // console.log(socket.current.emit);
      let flag = "alert";

      msg = "other";

      for (let elem in choicesActivateAux) {
        socket.current.emit("send-msg", {
          to: parseInt(choicesActivateAux[elem].USER_ID),
          from: dataX.USER_ID,
          msg,
          flag
        });
      }
    }

    setOutputMessageActivate(data.msg);
    console.log(outputMessageActivate);
  }
  
  const inviteMemberMenu = () => {
    console.log(inviteMenu);
    if (inviteMenu === 1) {
      setInviteMenu(0);
    } else {
      setInviteMenu(1);
    }
  };

  const graph1Menu = async () => {
    console.log(graph1);
    if (graph1 === 1) {
      setGraph1(0);
    } else {
      setGraph1(1);
      const data = await axios.get(`${allUsersInfo}/${currentUser.USER_ID}`);
      setChoicesGraph1(data.data);

    }
  };

  const graph2Menu = async () => {
    /*
    console.log(graph2);
    if (graph2 === 1) {
      setGraph2(0);
    } else {
      setGraph2(1);
      const data = await axios.get(`${allUsersInfo}/${currentUser.USER_ID}`);
      // setChoicesGraph2(data.data);

    }
    */
    const data = await axios.get(`${allUsersMessages}/${currentUser.ORGANIZATION_ID}`);
    console.log("graph2", data.data);
    
    let info = data.data;

    navigate("/graphic2", { state: { info } });
  };

  const graph3Menu = async () => {
    /*
    console.log(graph2);
    if (graph2 === 1) {
      setGraph2(0);
    } else {
      setGraph2(1);
      const data = await axios.get(`${allUsersInfo}/${currentUser.USER_ID}`);
      // setChoicesGraph2(data.data);

    }
    */
    const data = await axios.get(`${allUsersReceivedMessages}/${currentUser.ORGANIZATION_ID}`);
    console.log("graph3", data.data);
    
    let info = data.data;

    navigate("/graphic2", { state: { info } });
  };

  const graph4Menu = async () => {
    /*
    console.log(graph2);
    if (graph2 === 1) {
      setGraph2(0);
    } else {
      setGraph2(1);
      const data = await axios.get(`${allUsersInfo}/${currentUser.USER_ID}`);
      // setChoicesGraph2(data.data);

    }
    */
    const data = await axios.get(`${allUsersStatus}/${currentUser.ORGANIZATION_ID}`);
    console.log("graph3", data.data);
    
    let info = data.data;

    navigate("/graphic3", { state: { info } });
  };

  const deactivateMemberMenu = async () => {
    console.log(deactivate);
    if (deactivate === 1) {
      setDeactivate(0);
    } else {
      setDeactivate(1);
      const data = await axios.get(`${allUsersInfo}/${currentUser.USER_ID}`);
      const filteredVectorData = (data.data).filter(obj => obj.USER_ID !== currentUser.USER_ID && obj.STATUS === "ACTIVE");
      setChoicesDeactivate(filteredVectorData);
      const filteredVectorDataAux = (data.data).filter(obj => obj.USER_ID !== currentUser.USER_ID);
      setChoicesDeactivateAux(filteredVectorDataAux);
    }
  };

  const activateMemberMenu = async () => {
    console.log(activate);
    if (activate === 1) {
      setActivate(0);
    } else {
      setActivate(1);
      const data = await axios.get(`${allUsersInfo}/${currentUser.USER_ID}`);
      const filteredVectorData = (data.data).filter(obj => obj.USER_ID !== currentUser.USER_ID && obj.STATUS === "SUSPENDED");
      setChoicesActivate(filteredVectorData);
      const filteredVectorDataAux = (data.data).filter(obj => obj.USER_ID !== currentUser.USER_ID);
      setChoicesActivateAux(filteredVectorDataAux);
    }
  };

  function reloadPage() {
    window.location.reload();
  }

  const generateCSVData = (results) => {


    // Definiți capetele de coloană pentru CSV
    const headers = ['First Name', 'Last Name', 'Username', 'Email Address', 'Role in organization', 'Status'];
  
    // Formatați rezultatele în rânduri CSV
    const rows = results.map((result) => {
      const rowData = [result.FIRST_NAME, result.LAST_NAME, result.USER_NAME, result.EMAIL_ADDRESS, result.ROLE_IN_ORGANIZATION, result.STATUS];
      return rowData.join(',');
    });
  
    // Combinați capetele de coloană și rândurile într-un singur șir CSV
    const csvContent = [headers.join(','), ...rows].join('\n');
  
    return csvContent;
  };

  const handleDownload = async () => {

    const data = await axios.get(`${allUsersGeneralInfo}/${currentUser.ORGANIZATION_ID}`);
    // console.log("graph3", data.data);
    
    let info = data.data;

    console.log(info);

    const results = info;
    
    const csvContent = generateCSVData(results);

    // Crearea și descărcarea fișierului CSV
    const element = document.createElement('a');
    const file = new Blob([csvContent], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'output.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // foarte important, userii trebuie sa fie din aceeasi organizatie cu owner-ul
  return (
    <>
      <FormContainer>

        <div className="buttons">
          <div className="infoText"> The following buttons can be used to manage team members and generate useful reports within the organization </div>

          <button type="submit" className="button" onClick={() => inviteMemberMenu()} > Invite Member </button>

          <button type="submit" className="button" onClick={() => deactivateMemberMenu()}> Suspend Member</button>

          <button type="submit" className="button" onClick={() => activateMemberMenu()}> Activate Member</button>

          <button type="submit" className="button" onClick={() => graph1Menu()} > Messages per Time Intervals </button>

          <button type="submit" className="button" onClick={() => graph2Menu()} > Sent Messages </button>

          <button type="submit" className="button" onClick={() => graph3Menu()} > Received Messages </button>

          <button type="submit" className="button" onClick={() => graph4Menu()} > User Status </button>

          <button className="button" onClick={handleDownload}>Export Users as CSV</button>
  
        </div>

        <div className="forms">

          {
          inviteMenu === 1 ?
            (
            <form action="" onSubmit={(event) => handleSubmit(event)}>
              <input
                type="text"
                placeholder = "First Name"
                name = "firstname"
                onChange={(e) => handleChange(e)}
              />

              <input
                type="text"
                placeholder = "Last Name"
                name = "lastname"
                onChange={(e) => handleChange(e)}
              />

              <input
                type="text"
                placeholder = "Mail"
                name = "mail"
                onChange={(e) => handleChange(e)}
              />

              <button type="submit" className="buttonForm"> Invite Member </button>

              {outputMessage !== undefined ? (
              <div className="outputMessage"> {`${outputMessage}`} </div> ) : undefined }

            </form>
          ) : (graph1 === 1 ? ( 
                
              <form onSubmit={handleSubmitGraph1}>
                <label className="label">
                  Choose user:
                  <select value={selectedOption} onChange={(e) => {setSelectedOption(e.target.value)}}>
                    <option value="">Select an option</option>
                    {choicesGraph1.map((choice) => (
                      <option key={choice.USER_ID} value={choice.USER_ID}>
                        {choice.USER_ID === currentUser.USER_ID ? "Me" : choice.FIRST_NAME + " " + choice.LAST_NAME}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="buttonForm">Submit</button>
              </form>

               ) : (deactivate === 1 ? (
                  <form onSubmit={handleSubmitDeactivate}>
                    <label className="label">
                      Choose user:
                      <select value={selectedOption} onChange={(e) => {setSelectedOption(e.target.value)}}>
                        <option value="">Select an option</option>
                        {choicesDeactivate.map((choice) => (
                          <option key={choice.USER_ID} value={choice.USER_ID}>
                            {choice.USER_ID === currentUser.USER_ID ? "Me" : choice.FIRST_NAME + " " + choice.LAST_NAME}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" className="buttonForm">Suspend Member</button>
                    {outputMessageDeactivate !== undefined ? (
                    <div className="updateContacts">
                    <div className="outputMessage"> {`${outputMessageDeactivate}`} </div>
                    <button className="reloadButton" onClick={reloadPage}> Reload Page to update Contacts </button>
                    </div>
                     ) : undefined }
                  </form>
               ) : ( (activate === 1 ? (
                <form onSubmit={handleSubmitActivate}>
                  <label className="label">
                    Choose user:
                    <select value={selectedOption} onChange={(e) => {setSelectedOption(e.target.value)}}>
                      <option value="">Select an option</option>
                      {choicesActivate.map((choice) => (
                        <option key={choice.USER_ID} value={choice.USER_ID}>
                          {choice.USER_ID === currentUser.USER_ID ? "Me" : choice.FIRST_NAME + " " + choice.LAST_NAME}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="buttonForm">Activate Member</button>
                  {outputMessageActivate !== undefined ? (
                  <div className="updateContacts">
                  <div className="outputMessage"> {`${outputMessageActivate}`} </div>
                  <button className="reloadButton" onClick={reloadPage}> Reload Page to update Contacts </button>
                  </div> ) : undefined }
                </form>
             ) : (undefined))))) 
          }
        </div>

      </FormContainer>
    </>
  );
}

const FormContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  flex-direction: column;
  img {
    height: 20rem;
  }
  span {
    color: #4e0eff;
  }

  .label {
    color: black;
  }

  .outputMessage {
    color: black;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    align-items: center;
    .button {
      background-color: #f8f8ff;
      color: black;
      height: 20px;
      width: 350px;
      margin-bottom: 2px;
    }
    .infoText {
      height: 65px;
      width: 350px;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    background-color: #f8f8ff;
    padding: 5rem;
    margin-bottom: 25px;

    .buttonForm {
      background-color: #f8f8ff;
      color: black;
      height: 20px;
      width: 350px; 
    }
  }

  .updateContacts {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .reloadButton {
    background-color: #32cd32;
  }

  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid black;
    border-radius: 0.4rem;
    color: black;
    width: 100%;
    font-size: 1rem;
    &:focus {
      border: 0.1rem solid black;
      outline: none;
    }
  }

  button {
    margin-top: 5px;
    background-color: #4e0eff;
    color: white;
    padding: 1rem 1rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    &:hover {
      border: 0.1rem solid black;
    }
  }
`;