const Wit = require("node-wit").Wit;
const witClieent = new Wit({
  accessToken: "GBEMVNKTUQNZ5PWURNGMJXJKTX6EMC6D"
});
module.exports = (req, res) => {
  let message = req.body.userMessage;
  witClieent
    .message(message, {})
    .then(response => {
      res.send({ status: "ok", data: response });
    })
    .catch(err => {
      console.log(err);
      res.status(403).send({ status: "ko", message: err });
    });
};
