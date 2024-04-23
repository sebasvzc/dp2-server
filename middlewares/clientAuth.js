//importing modules
const db = require("../models");
//Assigning db.users to User variable
const Client = db.clients;

//Function to check if username or email already exist in the database
//this is to avoid having two users with the same username and email
const saveClient = async (req, res, next) => {
    //search the database to see if user exist
    console.log("Entre a xsdsad")
    try {
        console.log("Entre a comprobar")
        //checking if email already exist
        const emailcheck = await Client.findOne({
            where: {
                email: req.body.email,
            },
        });
        //if email exist in the database respond with a status of 409
        if (emailcheck) {
            return res.status(403).send("Email is duplicate. You don't have permission to perform this operation!");
        }
        next();
    } catch (error) {
        console.log(error);
    }
};

//exporting module
module.exports = {
    saveClient,
};