const express = require("express");
const { randomUUID } = require("crypto")

const app = express();
app.use(express.json());

const accountList = new Set();

app.post("/accounts", (request, response) => {
  const account = {
    id: randomUUID(),
    name: request.body.name,
    cpf: request.body.cpf,
    statement: [],
  };

  accountList.add(account);
  return response.json(account);
});

app.listen(3333);
