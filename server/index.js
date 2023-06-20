const express = require("express");
const cors = require("cors");
const UserAvatar = require("./configFirebase");

const app = express();
const socket = require("socket.io");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');

const crypto = require('crypto');

const registerUser = require('./register');

function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

require("dotenv").config();

app.use(cors());
app.use(express.json());


const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const mypw = "Bucuresti2806"  // set mypw to the hr schema password

function getTime() {
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  let sqlDate = year + "/" + month + "/" + date + " " + hours + ":" + minutes + ":" + seconds;

  return sqlDate;
}

async function run() {

  let connection;

  try {
    connection = await oracledb.getConnection( {
      user          : "Madalin",
      password      : mypw,
      connectString : "localhost/XE"
    });

    console.log("Connected successfully to Oracle DataBase");

    
    const server = app.listen(process.env.PORT, () =>
      console.log(`Server started on ${process.env.PORT}`)
    );

    const io = socket(server, {
      cors: {
        origin: "http://localhost:3000",
        credentials: true,
      },
    });

    global.onlineUsers = new Map();
    io.on("connection", (socket) => {
      global.chatSocket = socket;
      socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
      });

      socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
          socket.to(sendUserSocket).emit("msg-recieve", data);
        }
      });
    });

    // incerc sa adaug un alt socket pentru a da refresh la pagina la nevoie

    // createOrganization
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {

        app.post('/api/auth/register', async (req, res) => {
          try {
            await registerUser(req, res, connection);
          } catch (err) {
            console.error(err);
          }
        });

        app.post('/api/auth/changepassword', async (req, res) => {
          console.log(req.body);

          const checkRecoveryCode = await connection.execute(
            `SELECT * FROM RECOVERY_CODES WHERE RECOVERY_CODE = '${req.body.RecoveryPasswordCode}'`
          );
          // let id = 1;
          // verificam daca codul de acces se gaseste in baza de date si apoi 
          if (checkRecoveryCode.rows[0]) {
            console.log(checkRecoveryCode.rows[0]);
            console.log("The recovery code exists and the process can continue");
      
            const recovery_code = checkRecoveryCode.rows[0]["RECOVERY_CODE"];
            const user_id = checkRecoveryCode.rows[0]["USER_ID"];

            console.log(checkRecoveryCode.rows[0]["RECOVERY_CODE"]);

            const deleteRecoveryCode = await connection.execute(
              `DELETE FROM RECOVERY_CODES WHERE RECOVERY_CODE = '${recovery_code}'`
            );
      
            // eliminam codul din baza de date, inseamna ca e folosit deja
      
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
              
            // ramane de verificat daca codul pentru organizatia chiar este bun
            // tot de acolo extragem si id-ul organizatiei
            // poate punem un ttl pentru cod
            try {
                const result = await connection.execute(
                  `UPDATE USERS SET ENCRYPTED_PASSWORD = '${hashedPassword}' WHERE USER_ID = '${user_id}'`
                );
      
                if (result.rowsAffected === 1) {
                  console.log("Password changed successfully");
                  // cred ca ar trebui cautat dupa id
      
                    if (deleteRecoveryCode.rowsAffected === 1) {
      
                      console.log("Used access code successfully removed from data base");
              
                      connection.commit();
      
                    } else {
                      return res.json({ msg: "Error in changing password, the recovery code cannot be removed from database", status: false });
                    }
                } else {
                    return res.json({ msg: "Error in updating user", status: false });
                }
            } catch(err) {
                return res.json({ msg: "Error in updating the user", status: false });
            }
          } else {
            return res.json({ msg: "Error in changing the password, the recovery code is wrong", status: false });
          }

          return res.json({ msg: "Password changed successfully", status: true });
        });

        // trebuie testat
        app.post('/api/auth/createOrganization', async (req, res) => {

          ////////////////////////////////////////////////////////////////////////////////////////////////////////////

          console.log(req.body);
          const hashedPassword = await bcrypt.hash(req.body.password, 10);

          const result1 = await connection.execute(
            `SELECT MAX(ORGANIZATION_ID) FROM ORGANIZATIONS`
          );

          let id = 1;

          if (result1.rows[0]["MAX(ORGANIZATION_ID)"]) {
            id = result1.rows[0]["MAX(ORGANIZATION_ID)"] + 1;
          }
          
          // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
          // tot aici trebuie setat si id-ul user-ului
          const result = await connection.execute(
            `INSERT INTO ORGANIZATIONS(ORGANIZATION_ID, ORGANIZATION_NAME) VALUES(
              '${id}', '${req.body.organizationName}')`
          );

          if (result.rowsAffected === 1) {
            console.log("Organization added successfully");
            const resultSelect = await connection.execute(
              `SELECT * FROM ORGANIZATIONS WHERE ORGANIZATION_ID = '${id}'`
            );

            console.log(resultSelect);

            const result1 = await connection.execute(
              `SELECT MAX(USER_ID) FROM USERS`
            );
  
            let idUser = 1;
  
            if (result1.rows[0]["MAX(USER_ID)"]) {
              idUser = result1.rows[0]["MAX(USER_ID)"] + 1;
            }

            try {
              const result = await connection.execute(
                `INSERT INTO USERS(ORGANIZATION_ID, USER_ID, FIRST_NAME, LAST_NAME, USER_NAME, ENCRYPTED_PASSWORD, EMAIL_ADDRESS, ROLE_IN_ORGANIZATION, STATUS) VALUES(
                  '${id}', '${idUser}', '${req.body.firstname}', '${req.body.lastname}', '${req.body.username}', '${hashedPassword}', '${req.body.email}', 'OWNER', 'ACTIVE')`
              );
    
              if (result.rowsAffected === 1) {
                console.log("User added successfully");
                const resultSelect = await connection.execute(
                  `SELECT * FROM USERS WHERE USER_NAME = '${req.body.username}' AND EMAIL_ADDRESS = '${req.body.email}'`
                );
      
                let user = resultSelect.rows[0];
    
                const result1 = await connection.execute(
                  `INSERT INTO AVATARS(USER_ID, IS_AVATAR_IMAGE_SET, AVATAR_IMAGE_FIREBASE_ID) VALUES(
                    '${idUser}', 0, '')`
                );
    
                if (result1.rowsAffected === 1) {
                    console.log("Added avatar information");
                    const resultSelect = await connection.execute(
                      `SELECT * FROM AVATARS WHERE USER_ID = '${idUser}'`
                    );
      
                    let avatarInfo = resultSelect.rows[0];
      
                    let newUser = {...user, ...avatarInfo};
      
                    connection.commit();
      
                    console.log("Committed successfully");
        
                    console.log(newUser);
                  
                    ///////////
                    const resultLog = await connection.execute(
                      `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
                    );
          
                    let idLog = 1;
          
                    if (resultLog.rows[0]["MAX(LOG_ID)"]) {
                      idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
                    }
          
                    let sqlDate = getTime();
                    let activity_type = 'HTTP POST, ' + 'ROUTE: /api/auth/createOrganization';
                    let description = 'Organization ' + req.body.organizationName + ' was created with by ' + req.body.username;
                    // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
                    // tot aici trebuie setat si id-ul user-ului
                    const resultLog1 = await connection.execute(
                      `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
                        '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
                    );

                    connection.commit();
                    /////////
                    
                    return res.json({ status: true, user: newUser });
                } else {

                  ///////////
                  const resultLog = await connection.execute(
                    `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
                  );
          
                  let idLog = 1;
          
                  if (resultLog.rows[0]["MAX(LOG_ID)"]) {
                      idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
                  }
          
                  let sqlDate = getTime();
                  let activity_type = 'HTTP POST ' + 'ROUTE: /api/auth/createOrganization';
                  let description = 'Error in adding user';
                  // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
                  // tot aici trebuie setat si id-ul user-ului
                  const resultLog1 = await connection.execute(
                    `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
                      '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
                  );
                  /////////
                  connection.commit();

                  console.log("Error in adding user");
                  return res.json({ msg: "Error in adding user", status: false });
                }
              }
            } catch(err) {
              ///////////
              const resultLog = await connection.execute(
                `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
              );
          
              let idLog = 1;
          
              if (resultLog.rows[0]["MAX(LOG_ID)"]) {
                idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
              }
          
              let sqlDate = getTime();
              let activity_type = 'HTTP POST ' + 'ROUTE: /api/auth/createOrganization';
              let description = 'Error in adding user, email or username already exists in database';
              // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
              // tot aici trebuie setat si id-ul user-ului
              const resultLog1 = await connection.execute(
                `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
                '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
              );
              connection.commit();
              /////////
              return res.json({ msg: "Error in adding user, email or username already exists in database", status: false });
            }
          } else {
            ///////////
            const resultLog = await connection.execute(
              `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
            );
          
            let idLog = 1;
          
            if (resultLog.rows[0]["MAX(LOG_ID)"]) {
              idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
            }
          
            let sqlDate = getTime();
            let activity_type = 'HTTP POST ' + 'ROUTE: /api/auth/createOrganization';
            let description = 'Error in adding user, email or username already exists in database';
            // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
            // tot aici trebuie setat si id-ul user-ului
            const resultLog1 = await connection.execute(
              `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
              '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
            );
            /////////
            connection.commit();

            console.log("Error in adding organization");
            return res.json({ msg: "Error in adding organization", status: false });
          }
        })

        app.post('/api/auth/login', async (req, res) => {
          console.log(req.body);
          const hashedPassword = await bcrypt.hash(req.body.password, 10);

          const result = await connection.execute(
            `SELECT * FROM USERS WHERE USER_NAME = '${req.body.username}'`
          );

          if (result.rows[0]) {
            // console.log(result.rows[0]);
            let user = result.rows[0];

            bcrypt.compare(req.body.password, user.ENCRYPTED_PASSWORD, async function(err, result) {
              if (result === true) {

                if (user.STATUS == "SUSPENDED") {
                  return res.json({ msg: "this user is suspended", status: false });
                } else {
                  const result1 = await connection.execute(
                    `SELECT B.IS_AVATAR_IMAGE_SET, B.AVATAR_IMAGE_FIREBASE_ID FROM USERS A, AVATARS B WHERE A.USER_ID = B.USER_ID AND A.USER_ID = '${user.USER_ID}'`
                  );
        
                  // modific, abordare ineficienta la a lua imaginea din firebase
                  const snapshot = await UserAvatar.get();
        
                  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
                  let firebaseID = result1.rows[0].AVATAR_IMAGE_FIREBASE_ID;
                    
                  for (l in list) {
                    if (list[l].id === firebaseID) {
                      result1.rows[0].AVATAR_IMAGE = list[l].avatarImage
                    }
                  }
                  
                  user.isAvatarImageSet = result1.rows[0].IS_AVATAR_IMAGE_SET;
                  user.avatarImage = result1.rows[0].AVATAR_IMAGE;

                  ///////////
                  const resultLog = await connection.execute(
                    `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
                  );
          
                  let idLog = 1;
          
                  if (resultLog.rows[0]["MAX(LOG_ID)"]) {
                    idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
                  }
          
                  let sqlDate = getTime();
                  let activity_type = 'HTTP POST, ' + 'ROUTE: /api/auth/login';
                  let description = 'User ' + req.body.username + ' successfully logged in';
                  // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
                  // tot aici trebuie setat si id-ul user-ului
                  const resultLog1 = await connection.execute(
                    `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
                      '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
                  );

                  connection.commit();
                  /////////

                  return res.json({ status: true, user });
                } 
              }
              else {
                  
                ///////////
                const resultLog = await connection.execute(
                  `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
                );
          
                let idLog = 1;
          
                if (resultLog.rows[0]["MAX(LOG_ID)"]) {
                  idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
                }
          
                let sqlDate = getTime();
                let activity_type = 'HTTP POST, ' + 'ROUTE: /api/auth/login';
                let description = ' password wrong ';
                // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
                // tot aici trebuie setat si id-ul user-ului
                const resultLog1 = await connection.execute(
                  `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
                    '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
                );

                connection.commit();
                /////////

                return res.json({ msg: "password wrong", status: false });
              }
            });           
          } else {

            ///////////
            const resultLog = await connection.execute(
              `SELECT MAX(LOG_ID) FROM ACTIVITY_LOG`
            );
          
            let idLog = 1;
          
            if (resultLog.rows[0]["MAX(LOG_ID)"]) {
              idLog = resultLog.rows[0]["MAX(LOG_ID)"] + 1;
            }
          
            let sqlDate = getTime();
            let activity_type = 'HTTP POST, ' + 'ROUTE: /api/auth/login';
            let description = ' user not found in any organization ';
            // initial organizatia nu are un cod de access definit, urmand sa fie stabilit de owner
            // tot aici trebuie setat si id-ul user-ului
            const resultLog1 = await connection.execute(
              `INSERT INTO ACTIVITY_LOG(log_id, activity_type, activity_date, description) VALUES(
              '${idLog}', '${activity_type}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '${description}')`
            );

            connection.commit();

            return res.json({ msg: "user not found in any organization", status: false });
          }
        })

        app.post('/api/auth/setavatar/:id', async (req, res) => {

          const userId = req.params.id;
          const avatarImage = req.body.image;

          const response = await UserAvatar.add({"avatarImage": avatarImage});
          const avatar_image_firebase_id = response._delegate._key.path.segments[1];

          const result = await connection.execute(
            `UPDATE AVATARS SET IS_AVATAR_IMAGE_SET = 1, AVATAR_IMAGE_FIREBASE_ID = '${avatar_image_firebase_id}' WHERE USER_ID = '${req.params.id}'`
          );

          console.log(result);
          console.log(userId);
          console.log(req.params);
          
          // console.log(req.body);
          if (result.rowsAffected === 1) {
            console.log("Image set successfully");

            connection.commit();
            console.log("Committed successfully");

            return res.json({
              isSet: true,
              image: avatarImage,
            });

          } else {
            console.log("Error in setting the image");
            return res.json({ msg: "Error in setting the image", status: false });
          }
        })


        // router.get("/allusers/:id", getAllUsers);

        // router.get("/logout/:id", logOut);

        app.get('/api/auth/logout/:id', async (req, res) => {
          console.log(req.params.id);
          if (!req.params.id) return res.json({ msg: "User id is required " });
          onlineUsers.delete(req.params.id);
          return res.status(200).send();
        })  

        app.get('/api/auth/allusers/:id', async (req, res) => {

          const userId = req.params.id;
          // const avatarImage = req.body.image;

          // const response = await UserAvatar.add({"avatarImage": avatarImage});
          // const avatar_image_firebase_id = response._delegate._key.path.segments[1];

          const result = await connection.execute(
            `SELECT A.USER_NAME, A.FIRST_NAME, A.LAST_NAME, A.ORGANIZATION_ID, A.EMAIL_ADDRESS, A.USER_ID, A.STATUS, B.AVATAR_IMAGE_FIREBASE_ID FROM USERS A, AVATARS B WHERE A.USER_ID = B.USER_ID AND A.USER_ID != '${userId}'`
          );

          // modific, abordare ineficienta la a lua imaginea din firebase
          const snapshot = await UserAvatar.get();

          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          
          for(elem in result.rows) {
            // console.log(result.rows[elem]);

            let firebaseID = result.rows[elem].AVATAR_IMAGE_FIREBASE_ID;
            
            for (l in list) {
              if (list[l].id === firebaseID) {
                result.rows[elem].AVATAR_IMAGE = list[l].avatarImage
              }
            }
            
          }
          return(res.json(result.rows));
        })

        app.get('/api/auth/allusersinfo/:id', async (req, res) => {
          const userId = req.params.id;
          console.log(userId);
          const result = await connection.execute(
            `SELECT A.USER_NAME, A.FIRST_NAME, A.LAST_NAME, A.USER_ID, A.STATUS FROM USERS A WHERE A.ORGANIZATION_ID = (SELECT B.ORGANIZATION_ID FROM USERS B WHERE B.USER_ID = '${userId}')`
          );

          return(res.json(result.rows));
        })


        // /api/messages/allmessages

        app.post('/api/messages/allmessages', async (req, res) => {

          console.log(req.body);

          const result = await connection.execute(
            `SELECT MESSAGE, MESSAGE_DATE FROM MESSAGES WHERE FROM_ID = '${req.body.from}'`
          );

          return(res.json(result.rows));
        })

        // '/api/auth/allusersinfo/:id'
        // api/auth/allusersmessages
//  await axios.get(`${allUsersMessages}/${currentUser.ORGANIZATION_ID}`);
        // trimise
        app.get('/api/messages/allusersmessages/:id', async (req, res) => {

          const orgId = req.params.id;

          const result = await connection.execute(
            `select COUNT(B.message) AS NRmessages, A.organization_id, A.user_id, A.first_name, A.last_name from messages B, users A where A.user_id = B.from_id and A.organization_id = '${orgId}' group by A.user_id, A.first_name, A.last_name, A.organization_id`
          );

          console.log(result);

          return(res.json(result.rows));
        })

        // allusersreceivedmessages

        app.get('/api/messages/allusersreceivedmessages/:id', async (req, res) => {

          const orgId = req.params.id;

          const result = await connection.execute(
            `select COUNT(B.message) AS NRmessages, A.user_id, A.first_name, A.last_name, A.organization_id from messages B, users A, conversations C where (A.user_id = C.to_id or A.user_id = C.from_id) and A.user_id != B.from_id and C.conversation_id = B.conversation_id and A.organization_id = '${orgId}' group by A.user_id, A.first_name, A.last_name, A.organization_id`
          );

          console.log(result);

          return(res.json(result.rows));
        })

        app.get('/api/messages/allusersreceivedmessages/:id', async (req, res) => {

          const orgId = req.params.id;

          const result = await connection.execute(
            `select COUNT(B.message) AS NRmessages, A.user_id, A.first_name, A.last_name, A.organization_id from messages B, users A, conversations C where (A.user_id = C.to_id or A.user_id = C.from_id) and A.user_id != B.from_id and C.conversation_id = B.conversation_id and A.organization_id = '${orgId}' group by A.user_id, A.first_name, A.last_name, A.organization_id`
          );

          console.log(result);

          return(res.json(result.rows));
        })

        // /api/status/allusersstatus

        app.get('/api/status/allusersstatus/:id', async (req, res) => {

          const orgId = req.params.id;

          const result = await connection.execute(
            `select COUNT(STATUS) AS NRUsers, STATUS from USERS WHERE ORGANIZATION_ID = '${orgId}' group by STATUS`
          );

          console.log(result);

          return(res.json(result.rows));
        })

        // /api/users/allusersGeneralInfo

        app.get('/api/users/allusersGeneralInfo/:id', async (req, res) => {

          const orgId = req.params.id;

          const result = await connection.execute(
            `select FIRST_NAME, LAST_NAME, USER_NAME, EMAIL_ADDRESS, ROLE_IN_ORGANIZATION, STATUS from USERS WHERE ORGANIZATION_ID = '${orgId}'`
          );

          console.log(result);

          return(res.json(result.rows));
        })

        app.post('/api/messages/addmsg', async (req, res) => {

          console.log(req.body);

          let sqlDate = getTime();

          console.log(sqlDate);

          let idConversation;

          const result0 = await connection.execute(
            `SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE 
                                                  (FROM_ID = '${req.body.from}' AND TO_ID = '${req.body.to}') 
                                               OR (FROM_ID = '${req.body.to}' AND TO_ID = '${req.body.from}')`
          );

          if (result0.rows.length > 0) {
            console.log("ana are mere");
            idConversation = result0.rows[0]["CONVERSATION_ID"];
          } else {
              const result1 = await connection.execute(
                `SELECT MAX(CONVERSATION_ID) FROM CONVERSATIONS`
              );
    
              idConversation = 1;
    
              if (result1.rows[0]["MAX(CONVERSATION_ID)"]) {
                idConversation = result1.rows[0]["MAX(CONVERSATION_ID)"] + 1;
              }

              const result = await connection.execute(
                `INSERT INTO CONVERSATIONS(CONVERSATION_ID, FROM_ID, TO_ID) VALUES(
                  '${idConversation}', '${req.body.from}', '${req.body.to}')`
              );
    
              if (result.rowsAffected === 1) {
                console.log("Conversation added successfully");
              } else {
                return res.json({ msg: "Failed to add conversation to the database" });
              }
          }

          const result1 = await connection.execute(
            `SELECT MAX(MESSAGE_ID) FROM MESSAGES`
          );

          let idMessage = 1;

          if (result1.rows[0]["MAX(MESSAGE_ID)"]) {
            idMessage = result1.rows[0]["MAX(MESSAGE_ID)"] + 1;
          }

          const result = await connection.execute(
            `INSERT INTO MESSAGES(MESSAGE_ID, FROM_ID, CONVERSATION_ID, MESSAGE, MESSAGE_DATE, READ) VALUES(
              '${idMessage}', '${req.body.from}', '${idConversation}', '${req.body.message}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'), '0')`
          );

          if (result.rowsAffected === 1) {
            console.log("Message added successfully");

            connection.commit();
            console.log("Committed successfully");

            return res.json({ msg: "Message added successfully." });
          } else {
              console.log("Error in adding message");
              return res.json({ msg: "Failed to add message to the database" });
          }
        })

        // const response = await axios.post(readAllMessagesRoute, {
          // from: contacts,
          // to: currentUserId
        // });

        app.post('/api/messages/readAllMessages', async (req, res) => {


          const result = await connection.execute(
            `SELECT A.USER_ID FROM USERS A WHERE A.ORGANIZATION_ID = (SELECT B.ORGANIZATION_ID FROM USERS B WHERE B.USER_ID = '${req.body.to}')`
          );

          let array = result.rows;

          for (let elem in array) {
            let idConversation;

            const result0 = await connection.execute(
              `SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE 
                                                    (FROM_ID = '${array[elem].USER_ID}' AND TO_ID = '${req.body.to}') 
                                                OR (FROM_ID = '${req.body.to}' AND TO_ID = '${array[elem].USER_ID}')`
            );

            if (result0.rows.length > 0) {
              idConversation = result0.rows[0]["CONVERSATION_ID"];
            
              // console.log(idConversation, req.body.from);
              const result = await connection.execute(
                `UPDATE MESSAGES SET READ = 1 WHERE CONVERSATION_ID = '${idConversation}' AND FROM_ID = '${array[elem].USER_ID}'`
              );
            }

            connection.commit();
          }

        })

        // checkUnreadMessages

        app.post('/api/messages/checkUnreadMessages', async (req, res) => {

          let idConversation;

          const result0 = await connection.execute(
            `SELECT CONVERSATION_ID FROM CONVERSATIONS WHERE 
                                                  (FROM_ID = '${req.body.from}' AND TO_ID = '${req.body.to}') 
                                               OR (FROM_ID = '${req.body.to}' AND TO_ID = '${req.body.from}')`
          );

          if (result0.rows.length > 0) {
            idConversation = result0.rows[0]["CONVERSATION_ID"];

            const result = await connection.execute(
              `SELECT MESSAGE_ID FROM MESSAGES WHERE CONVERSATION_ID = '${idConversation}' AND READ = 0 AND FROM_ID = '${req.body.from}'`
            );

            // console.log("test test", result.rows);
            if (result.rows.length > 0) {
              return res.json({ status: true })
            } else {
              return res.json({status: false })
            }

          } else {
            return res.json({ status: false }); 
          }
        })

        app.post('/api/messages/getmsg', async (req, res) => {
          
          // console.log(req.body);
          // return res.json({ msg: "Message added successfully." });

          const result = await connection.execute(
            `SELECT B.MESSAGE_ID, B.FROM_ID, B.MESSAGE, B.MESSAGE_DATE FROM CONVERSATIONS A, MESSAGES B WHERE ((A.FROM_ID = '${req.body.from}' AND A.TO_ID = '${req.body.to}') 
                                                              OR (A.FROM_ID = '${req.body.to}' AND A.TO_ID = '${req.body.from}')) AND B.CONVERSATION_ID = A.CONVERSATION_ID 
                                                              ORDER BY MESSAGE_DATE ASC`
          );

          console.log(result.rows);

          
          // let messages = [];

          for (elem in result.rows) {
            if (result.rows[elem].FROM_ID === req.body.from) {
              result.rows[elem].fromSelf = true;
            } else {
              result.rows[elem].fromSelf = false;
            }
             
          }

          console.log(result.rows);
          
          return res.json(result.rows);
          
          // console.log(result.rows);
          
        })

        app.post('/api/auth/inviteMember', async (req, res) => {
          console.log(req.body);

          const resultUsers = await connection.execute(
            `SELECT * FROM USERS WHERE USER_ID = '${req.body.ownerId}'`
          );

          let user = resultUsers.rows[0];

          const organization_id = user.ORGANIZATION_ID;

          const resultOrganization = await connection.execute(
            `SELECT * FROM ORGANIZATIONS WHERE ORGANIZATION_ID = '${organization_id}'`
          );

          const organization_name = resultOrganization.rows[0].ORGANIZATION_NAME;

          console.log(resultOrganization.rows[0].ORGANIZATION_NAME);

          // create reusable transporter object using SMTP transport
          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'teamconnect.log@gmail.com',
                pass: 'ygvdprsinjwxeaup'
            }
          });

          const accessCode = generateRandomString(5);

          // setup email data with unicode symbols
          let mailOptions = {
            from: 'teamconnect.log@gmail.com', // sender address
            to: req.body.mail, // list of receivers
            subject: 'Join our organization', // Subject line
            text: 'Hello ' + req.body.firstname + ", " + organization_name + " organization would like you to be part of our team. In order to create your account, please use the following access code: " + accessCode // plain text body
          };

          // send mail with defined transport object
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.json({ msg: "Error in sending the message", status: false })
              } else {
                console.log('Message sent: %s', info.messageId);
            }
          });

          console.log(accessCode);

          const result1 = await connection.execute(
            `SELECT MAX(ACCESS_CODE_ID) FROM ACCESS_CODES`
          );

          let idAccessCode = 1;

          if (result1.rows[0]["MAX(ACCESS_CODE_ID)"]) {
            idAccessCode = result1.rows[0]["MAX(ACCESS_CODE_ID)"] + 1;
          }

          const result = await connection.execute(
            `INSERT INTO ACCESS_CODES(ACCESS_CODE_ID, ACCESS_CODE, ORGANIZATION_ID) VALUES(
              '${idAccessCode}', '${accessCode}', '${organization_id}')`
          );

          if (result.rowsAffected === 1) {
            console.log("Member invited successfully");
            connection.commit();
            return res.json({ msg: "Member invited successfully", status: true })
          }
        })

        app.post('/api/auth/recoverpassword', async (req, res) => {
          console.log(req.body);
          
          const resultUsers = await connection.execute(
            `SELECT * FROM USERS WHERE EMAIL_ADDRESS = '${req.body.email}'`
          );

          if (resultUsers.rows[0] === undefined) {
            return res.json({ msg: "wrong email", status: false });
          }

          let user_id = (resultUsers.rows[0]).USER_ID;
          let user_name = (resultUsers.rows[0]).USER_NAME;

          // create reusable transporter object using SMTP transport
          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'teamconnect.log@gmail.com',
                pass: 'ygvdprsinjwxeaup'
            }
          });

          const recoveryCode = generateRandomString(5);

          // setup email data with unicode symbols
          let mailOptions = {
            from: 'teamconnect.log@gmail.com', // sender address
            to: req.body.email, // list of receivers
            subject: 'Recovery Password', // Subject line
            text: 'Hello ' + user_name + ", " + "In order to change your password, please use the following recovery code: " + recoveryCode // plain text body
          };

          // send mail with defined transport object
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.json({ msg: "Error in sending the message", status: false })
              } else {
                console.log('Message sent: %s', info.messageId);
            }
          });

          console.log(recoveryCode);

          const result1 = await connection.execute(
            `SELECT MAX(RECOVERY_CODE_ID) FROM RECOVERY_CODES`
          );

          let idRecoveryCode = 1;

          if (result1.rows[0]["MAX(RECOVERY_CODE_ID)"]) {
            idRecoveryCode = result1.rows[0]["MAX(RECOVERY_CODE_ID)"] + 1;
          }

          const result = await connection.execute(
            `INSERT INTO RECOVERY_CODES(RECOVERY_CODE_ID, USER_ID, RECOVERY_CODE) VALUES(
              '${idRecoveryCode}', '${user_id}', '${recoveryCode}')`
          );

          if (result.rowsAffected === 1) {
            console.log("Recovery Code sent successfully");
            connection.commit();
            return res.json({ msg: "Recovery Code sent successfully", status: true })
          }
          
        })

        // export const recoverPasswordRoute = `${host}/api/auth/recoverpassword`;


        app.post('/api/messages/suspendUser', async (req, res) => {
          console.log(req.body);


          const result = await connection.execute(

            `UPDATE USERS SET STATUS = 'SUSPENDED' WHERE USER_ID = '${req.body.userID}'`

          );

          console.log(result);

          if (result.rowsAffected === 1) {
            console.log("Member suspended successfully");
            connection.commit();
            return res.json({ msg: "", status: true })
          }

          return res.json({ msg: "error", status: false })

        })

        app.post('/api/messages/activateUser', async (req, res) => {
          console.log(req.body);


          const result = await connection.execute(

            `UPDATE USERS SET STATUS = 'ACTIVE' WHERE USER_ID = '${req.body.userID}'`

          );

          console.log(result);

          if (result.rowsAffected === 1) {
            console.log("Member activated successfully");
            connection.commit();
            return res.json({ msg: "", status: true })
          }

        })

        app.post('/api/news/getAllNews', async (req, res) => {
        

          const result = await connection.execute(
            `SELECT N.NEWS_TEXT, N.NEWS_DATE, A.USER_NAME, A.FIRST_NAME, A.LAST_NAME, A.ORGANIZATION_ID, A.EMAIL_ADDRESS, A.USER_ID, B.AVATAR_IMAGE_FIREBASE_ID FROM NEWS N, USERS A, AVATARS B WHERE N.USER_ID = A.USER_ID AND A.USER_ID = B.USER_ID ORDER BY N.NEWS_DATE DESC`
          );

          // modific, abordare ineficienta la a lua imaginea din firebase
          /*
          const snapshot = await UserAvatar.get();

          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          
          for(elem in result.rows) {
            // console.log(result.rows[elem]);

            let firebaseID = result.rows[elem].AVATAR_IMAGE_FIREBASE_ID;
            
            for (l in list) {
              if (list[l].id === firebaseID) {
                result.rows[elem].AVATAR_IMAGE = list[l].avatarImage
              }
            }
          }
          */
          

          return(res.json(result.rows)); // avem contactele aici
          // console.log(result.rows);
        })

        // trebuie verificat aici
        app.post('/api/news/postNewsFeed', async (req, res) => {

          console.log(req.body);

          let sqlDate = getTime();

          console.log(sqlDate);

          const result1 = await connection.execute(
            `SELECT MAX(NEWS_ID) FROM NEWS`
          );
    
          idNews = 1;
    
          if (result1.rows[0]["MAX(NEWS_ID)"]) {
            idNews = result1.rows[0]["MAX(NEWS_ID)"] + 1;
          }

          const result = await connection.execute(
            `INSERT INTO NEWS(NEWS_ID, USER_ID, NEWS_TEXT, NEWS_DATE) VALUES(
              '${idNews}', '${req.body.user_id}','${req.body.news_text}', TO_DATE('${sqlDate}', 'yyyy/mm/dd hh24:mi:ss'))`
          );
    
          if (result.rowsAffected === 1) {
            console.log("News added successfully");
    
            connection.commit();
            console.log("Committed successfully");
    
            return res.json({ msg: "News added successfully." });
          } else {
              console.log("Error in adding news");
              return res.json({ msg: "Failed to add news to the database" });
          }
         })
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();
