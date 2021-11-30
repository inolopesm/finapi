const express = require("express");
const { randomUUID } = require("crypto")

const app = express();
app.use(express.json());

const accountList = new Set();

app.post("/accounts", (request, response) => {
  for (const account of accountList) {
    if (account.cpf === request.body.cpf) {
      return response.status(400).json({
        error: "account already exists!",
      });
    }
  }

  const account = {
    id: randomUUID(),
    name: request.body.name,
    cpf: request.body.cpf,
    statement: [],
  };

  accountList.add(account);
  return response.json(account);
});

app.get("/accounts/:accountCpf/statement", (request, response) => {
  const { accountCpf } = request.params

  for (const account of accountList) {
    if (account.cpf === accountCpf) {
      return response.json(account.statement);
    }
  }

  return response.status(400).json({
    error: "account not found",
  });
});

app.listen(3333);
