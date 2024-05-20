const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const changeOutputValue = (inputValue) => {
  return {
    id: inputValue.id,
    todo: inputValue.todo,
    priority: inputValue.priority,
    status: inputValue.status,
    category: inputValue.category,
    dueDate: inputValue.due_date,
  };
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//get todo with status TODO

app.get("/todos/", async (request, response) => {
  let getToDosQuery;
  let dbArray;
  const { status, search_q = "", priority, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getToDosQuery = `SELECT * FROM todo  WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
        dbArray = await db.all(getToDosQuery);
        response.send(
          dbArray.map((eachObject) => changeOutputValue(eachObject))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getToDosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
        dbArray = await db.all(getToDosQuery);
        response.send(
          dbArray.map((eachObject) => changeOutputValue(eachObject))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getToDosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}';`;
        dbArray = await db.all(getToDosQuery);
        response.send(
          dbArray.map((eachObject) => {
            return changeOutputValue(eachObject);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getToDosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}$' AND status = '${status}' AND priority = '${priority}';`;
          dbArray = await db.all(getToDosQuery);
          response.send(
            dbArray.map((eachObject) => {
              return changeOutputValue(eachObject);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperty(request.query):
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
          getToDosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}$' AND status = '${status}' AND category = '${category}';`;
          dbArray = await db.all(getToDosQuery);
          response.send(
            dbArray.map((eachObject) => {
              return changeOutputValue(eachObject);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperty(request.query):
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
          getToDosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}$' AND  priority = '${priority}' AND category = '${category}';`;
          dbArray = await db.all(getToDosQuery);
          response.send(
            dbArray.map((eachObject) => {
              return changeOutputValue(eachObject);
            })
          );
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
      getToDosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      dbArray = await db.all(getToDosQuery);
      response.send(dbArray.map((eachObject) => changeOutputValue(eachObject)));
  }
});

// GET specific TODO

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const output = await db.get(getTodoQuery);
  response.send(changeOutputValue(output));
});

// GET TODO with a specific due date

app.get("/agenda", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date))) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${formattedDate}';`;
    const dbArray = await db.all(getTodoQuery);
    response.send(dbArray.map((eachObject) => changeOutputValue(eachObject)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//POST a new TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let insertTodosQuery;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (isValid(new Date(dueDate))) {
          const formatDate = format(new Date(dueDate), "yyyy-MM-dd");
          insertTodosQuery = `INSERT INTO todo (id, todo, priority, status, category, due_date)
              VALUES
              (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formatDate}');`;
          await db.run(insertTodosQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// update Todo Details

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const previousTodoQuery = `SELECT * From todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case hasStatusProperty(request.body):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET  todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.body):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE todo SET  todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.body):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET  todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case request.body.dueDate !== undefined:
      if (isValid(new Date(dueDate))) {
        const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET  todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${formattedDate}' WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case request.body.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET  todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

// Delete todo Query

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
