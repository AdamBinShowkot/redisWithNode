
const express = require("express");
const axios = require("axios");
const redis = require("redis");

const app = express();
const port = process.env.PORT || 3005;

let redisClient;

// connect with redis server
(async () => {
    redisClient = redis.createClient();
  
    redisClient.on("error", (error) => console.error(`Error : ${error}`));
  
    await redisClient.connect();
  })();


// Fetch todo lists
async function fetchTodos(limit) {
  const apiResponse = await axios.get(
    `https://jsonplaceholder.typicode.com/todos?_limit=`+limit
  );
  console.log("Request sent to the API");
  return apiResponse.data;
}


// Get Todo Lists Controller
async function getTodoLists(req, res) {
    const limits=req.params.limit;
    const todos = 'getTodos';
    let results;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(todos);
      if (cacheResults) {
        isCached = true;
        results = JSON.parse(cacheResults);
      } else {
        results = await fetchTodos(limits);
        if (results.length === 0) {
          throw "API returned an empty array";
        }
        await redisClient.set(todos, JSON.stringify(results),{
            EX: 240,
            NX: true,
        });
      }
  
      res.send({
        isCached: isCached,
        data: results,
      });
    } catch (error) {
      console.error(error);
      res.status(404).send("Data unavailable");
    }
}


// For Del Key from redis store
const addNewDemo=async(req,res)=>{
    redisClient.del('getTodos');
    res.status(200).send({
        message:"Insert Success!"
    })
}
  

app.get("/toto/:limit", getTodoLists);
app.post("/toto/new", addNewDemo);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});