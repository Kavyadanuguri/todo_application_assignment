const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
app.use(express.json());

const dbpath = path.join(__dirname, "todoApplication.db");
let db = null;

const InitializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`dberror : ${e.message}`);
    process.exit(1);
  }
};
InitializeAndStartServer();

const hasPriorityAndStatus = (obj) => {
  return obj.status !== undefined && obj.priority !== undefined;
};

const hasCategoryAndStatus = (obj) => {
  return obj.status !== undefined && obj.category !== undefined;
};

const hasCategoryAndPriority = (obj) => {
  return obj.priority !== undefined && obj.category !== undefined;
};

const hasStatus = (obj) => {
  return obj.status !== undefined;
};

const hasPriority = (obj) => {
  return obj.priority !== undefined;
};

const hasCategory = (obj) => {
  return obj.category !== undefined;
};

const convertToCamelCase = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    category: obj.category,
    status: obj.status,
    dueDate: obj.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let getTodoDetails = "";
  let data = "";

  switch (true) {
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                     status = '${status}';`;

        data = await db.all(getTodoDetails);
        response.send(data.map((each) => convertToCamelCase(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                    priority = '${priority}';`;

        data = await db.all(getTodoDetails);
        response.send(data.map((each) => convertToCamelCase(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                     priority = '${priority}'
                     AND status = '${status}';`;

          data = await db.all(getTodoDetails);
          response.send(data.map((each) => convertToCamelCase(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                     status = '${status}'
                     AND category = '${category}';`;

          data = await db.all(getTodoDetails);
          response.send(data.map((each) => convertToCamelCase(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                      category = '${category}';`;
        data = await db.all(getTodoDetails);
        response.send(data.map((each) => convertToCamelCase(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                     priority = '${priority}'
                     AND category = '${category}';`;

          data = await db.all(getTodoDetails);
          response.send(data.map((each) => convertToCamelCase(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoDetails = `
                    SELECT *
                    FROM
                    todo
                    WHERE
                     todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoDetails);
      response.send(data.map((each) => convertToCamelCase(each)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todosList = `
        select *
        from todo
        where 
         id = ${todoId};
    `;
  const todos = await db.get(todosList);
  response.send(convertToCamelCase(todos));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getQuery = `
           SELECT *
           FROM 
           todo
           WHERE 
            due_date = '${newDate}'; `;
    const responseArray = await db.all(getQuery);
    response.send(responseArray.map((each) => convertToCamelCase(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const getTodoDetails = `
                  INSERT INTO todo (id, todo, priority, status, category, due_date)
                  VALUES (
                      ${id},
                     '${todo}',
                     '${priority}',
                     '${status}',
                     '${category}',
                     '${postNewDate}' );`;

          await db.run(getTodoDetails);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  const previousTodo = `
        SELECT *
        FROM todo
        WHERE 
         id = ${todoId}; `;
  const previousArray = await db.get(previousTodo);

  const {
    todo = previousArray.todo,
    priority = previousArray.priority,
    status = previousArray.status,
    category = previousArray.category,
    dueDate = previousArray.dueDate,
  } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateDetails = `
              UPDATE todo
                 SET
                  todo = '${todo}',
                priority = '${priority}',
                 status = '${status}',
                 category = '${category}',
               due_date = '${dueDate}'
               WHERE 
                id = ${todoId};`;

        await db.run(updateDetails);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        const updateDetails = `
              UPDATE todo
                 SET
                  todo = '${todo}',
                priority = '${priority}',
                 status = '${status}',
                 category = '${category}',
               due_date = '${dueDate}'
               WHERE 
                id = ${todoId};`;

        await db.run(updateDetails);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateDetails = `
              UPDATE todo
                 SET
                  todo = '${todo}',
                priority = '${priority}',
                 status = '${status}',
                 category = '${category}',
               due_date = '${dueDate}'
               WHERE 
                id = ${todoId};`;

        await db.run(updateDetails);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.todo !== undefined:
      const updateDetails = `
              UPDATE todo
                 SET
                 todo = '${todo}',
                 priority = '${priority}',
                 status = '${status}',
                 category = '${category}',
                 due_date = '${dueDate}'
               WHERE 
                id = ${todoId};`;

      await db.run(updateDetails);
      response.send("Todo Updated");

      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        const updateDetails = `
              UPDATE todo
                 SET
                  todo = '${todo}',
                priority = '${priority}',
                 status = '${status}',
                 category = '${category}',
               due_date = '${newDate}'
               WHERE 
                id = ${todoId};`;

        await db.run(updateDetails);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM 
        todo
        WHERE
        id = '${todoId}';`;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
