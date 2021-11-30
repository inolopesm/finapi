const express = require("express");
const { randomUUID } = require("crypto")

const app = express();
app.use(express.json());

const accountList = [];

function verifyIfAccountExistsByCPF(request, response, next) {
  const account = accountList.find((account) =>
    account.cpf === request.params.accountCpf
  );

  if (account === undefined) {
    return response.status(400).json({ error: "account not found" });
  }

  request.account = account;
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === "credit") {
      return accumulator + operation.amount;
    }

    if (operation.type === "debit") {
      return accumulator - operation.amount;
    }

    throw new Error(`operation of type ${operation.type} is not expected`);
  }, 0);

  return balance;
}

function toDateISOString(date) {
  const [dateString] = date.toISOString().split('T');
  return dateString;
}

function mapAccount(account) {
  const mappedAccount = { ...account };
  Reflect.deleteProperty(mappedAccount, "statement");
  return mappedAccount;
}

app.post("/accounts", (request, response) => {
  const accountAlreadyExists = accountList.some((account) =>
    account.cpf === request.params.accountCpf
  );

  if (accountAlreadyExists) {
    return response.status(400).json({ error: "account already exists!" });
  }

  const account = {
    id: randomUUID(),
    name: request.body.name,
    cpf: request.body.cpf,
    statement: [],
  };

  accountList.push(account);
  return response.json(account);
});

app.get(
  "/accounts/:accountCpf/statement",
  verifyIfAccountExistsByCPF,
  (request, response) => response.json(request.account.statement)
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
      createdAt: new Date(),
    };

    request.account.statement.push(statementOperation);
    return response.json(statementOperation);
  }
);

app.post(
  "/accounts/:accountCpf/withdrawals",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    const balance = getBalance(request.account.statement);

    if (balance < request.body.amount) {
      return response.status(400).json({ error: "insufficient funds!" });
    }

    const statementOperation = {
      id: randomUUID(),
      type: "debit",
      amount: request.body.amount,
      createdAt: new Date(),
    };

    request.account.statement.push(statementOperation);
    return response.json(statementOperation);
  }
);

app.get(
  "/accounts/:accountCpf/statement/:operationDate",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    const operationDate = new Date(request.params.operationDate);

    const statement = request.account.statement.filter((operation) =>
      toDateISOString(operation.createdAt) === toDateISOString(operationDate)
    );

    return response.json(statement);
  }
);

app.put(
  "/accounts/:accountCpf",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    request.account.name = request.body.name;
    return response.json(mapAccount(request.account));
  }
);

app.get(
  "/accounts/:accountCpf",
  verifyIfAccountExistsByCPF,
  (request, response) => response.json(mapAccount(request.account))
);

app.delete(
  "/accounts/:accountCpf",
  verifyIfAccountExistsByCPF,
  (request, response) => {
    accountList.splice(request.account, 1);
    return response.end();
  }
);

app.listen(3333);
