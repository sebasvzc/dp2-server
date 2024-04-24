
//signing a user up
//hashing users password before its saved to the database
const db = require("../models");
const UserInv = db.usersInv;
const createUserInv = async (req, res) => {

    try {
        console.log("entre a registrar nuevo usuariop")
        const data = {
            email: email,
            active:1
        };
        //saving the user
        const user = await UserInv.create(data);
        //if user details is captured
        //generate token with the user's id and the secretKey in the env file
        // set cookie with the token generated
        if (user) {

            console.log("userInv", JSON.stringify(user, null, 2));

            //send users details
            //broadcast(req.app.locals.clients, 'signup', user);
            return res.status(200).send(user);
        } else {
            return res.status(400).send("Invalid request body");
        }


    } catch (error) {
        console.log('createUserInv - [Error]: ', error);
    }
}

module.exports = {
    createUserInv
};