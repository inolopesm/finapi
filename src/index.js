const express = require("express");
const { randomUUID } = require("crypto")

const app = express();
app.use(express.json());

const accountList = new Set();

function verifyIfAccountExistsByCPF(request, response, next) {
  for (const account of accountList) {
    if (account.cpf === request.params.accountCpf) {
      request.account = account
      return next();
    }
  }

  return response.status(400).json({ error: "account not found" });
}

app.post("/accounts", (request, response) => {
  for (const account of accountList) {
    if (account.cpf === request.body.cpf) {
      return response.status(400).json({ error: "account already exists!" });
    }
  }

  const account = {
    id: randomUUID(),
    name: request.body.name,
    cpf: request.body.cpf,
    statement: new Set(),
  };

  accountList.add(account);
  return response.json(account);
});

app.get(
  "/accounts/:accountCpf/statement",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    return response.json(Array.from(request.account.statement));
  }
);

app.post(
  "/accounts/:accountCpf/deposits",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    const statementOperation = {
      id: randomUUID(),
      type: "credit",
      description: request.body.description,
      amount: request.body.amount,
      created_at: new Date(),
    };

    request.account.statement.add(statementOperation)
    return response.json(statementOperation)
  }
);

app.listen(3333);
