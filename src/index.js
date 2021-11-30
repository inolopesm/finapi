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

function getBalance(statement) {
  const balance = Array.from(statement).reduce((accumulator, operation) => {
    if (operation.type === "credit") {
      return accumulator + operation.amount;
    }

    if (operation.type === "debit") {
      return accumulator - operation.amount;
    }

    throw new Error(`operation of type ${operation.type} is not expected`)
  }, 0);

  return balance;
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

app.post(
  "/accounts/:accountCpf/withdrawals",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    const balance = getBalance(request.account.statement)

    if (balance < request.body.amount) {
      return response.status(400).json({ error: "insufficient funds!" });
    }

    const statementOperation = {
      id: randomUUID(),
      type: "debit",
      amount: request.body.amount,
      created_at: new Date(),
    };

    request.account.statement.add(statementOperation);
    return response.json(statementOperation);
  }
)

app.listen(3333);
