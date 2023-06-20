const bcrypt = require("bcrypt");

module.exports = async function registerUser(req, res, connection) {
    // res.send("POST Request Called")
    console.log(req.body);

    const checkAccessCode = await connection.execute(
      `SELECT ORGANIZATION_ID FROM ACCESS_CODES WHERE ACCESS_CODE = '${req.body.organizationAccessCode}'`
    );

    // let id = 1;
    // verificam daca codul de acces se gaseste in baza de date si apoi 
    if (checkAccessCode.rows[0]) {

      console.log("The access code exists and the process can continue");

      const organization_id = checkAccessCode.rows[0]["ORGANIZATION_ID"];

      console.log(checkAccessCode.rows[0]["ORGANIZATION_ID"]);
      const deleteAccessCode = await connection.execute(
        `DELETE FROM ACCESS_CODES WHERE ACCESS_CODE = '${req.body.organizationAccessCode}'`
      );

      // eliminam codul din baza de date, inseamna ca e folosit deja


      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const result1 = await connection.execute(
        `SELECT MAX(USER_ID) FROM USERS`
      );

      let id = 1;

      if (result1.rows[0]["MAX(USER_ID)"]) {
        id = result1.rows[0]["MAX(USER_ID)"] + 1;
      }
        
      // ramane de verificat daca codul pentru organizatia chiar este bun
      // tot de acolo extragem si id-ul organizatiei
      // poate punem un ttl pentru cod
      try {
          const result = await connection.execute(
            `INSERT INTO USERS(ORGANIZATION_ID, USER_ID, USER_NAME, FIRST_NAME, LAST_NAME, ENCRYPTED_PASSWORD, EMAIL_ADDRESS, ROLE_IN_ORGANIZATION, STATUS) VALUES(
              '${organization_id}', '${id}', '${req.body.username}', '${req.body.firstname}', '${req.body.lastname}', '${hashedPassword}', '${req.body.email}', 'MEMBER', 'ACTIVE')`
          );

          if (result.rowsAffected === 1) {
            console.log("User added successfully");
            // cred ca ar trebui cautat dupa id
            const resultSelect = await connection.execute(
              `SELECT * FROM USERS WHERE USER_NAME = '${req.body.username}' AND EMAIL_ADDRESS = '${req.body.email}'`
            );
            
            let user = resultSelect.rows[0];

            // IS_AVATAR_IMAGE_SET, AVATAR_IMAGE_FIREBASE_ID
            
            const result1 = await connection.execute(
              `INSERT INTO AVATARS(USER_ID, IS_AVATAR_IMAGE_SET, AVATAR_IMAGE_FIREBASE_ID) VALUES(
                '${id}', 0, '')`
            );

            if (result1.rowsAffected === 1) {
              console.log("Added avatar information");
              const resultSelect = await connection.execute(
                `SELECT * FROM AVATARS WHERE USER_ID = '${id}'`
              );

              let avatarInfo = resultSelect.rows[0];

              let newUser = {...user, ...avatarInfo};

              connection.commit();

              console.log("Committed successfully");

              console.log(newUser);

              if (deleteAccessCode.rowsAffected === 1) {

                console.log("Used access code successfully removed from data base");
        
                connection.commit();

              } else {
                return res.json({ msg: "Error in adding user, the access code cannot be removed from database", status: false });
              }

              return res.json({ status: true, user: newUser });
            } else {
              console.log("Error in adding user");
            }
          } else {
            return res.json({ msg: "Error in adding user", status: false });
          }
        } catch(err) {
          return res.json({ msg: "Error in adding user, email or username already exists in database", status: false });
        }

    } else {
      return res.json({ msg: "Error in adding user, the access code is wrong", status: false });
    } 
  }