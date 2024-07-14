const express = require("express");
const app = express();

const MindsDB = require("mindsdb-js-sdk").default;
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

async function connectToMindsDB() {
  try {
    await MindsDB.connect({
      host: "http://localhost:47334",
    });
    console.log("Successfully connected to MindsDB!");
  } catch (error) {
    console.error("Failed to connect to local instance:", error);
  }
}

connectToMindsDB();
app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/views/dashboard.html");
});

app.get("/", (req, res) => {
  res.render("index");
});
// predit the CA home value start
app.post("/predict", async (req, res) => {
  try {
    const query =
      "SELECT ocean_proximity, median(median_house_value) AS median_house_price, median(median_income) AS median_income, median(housing_median_age) AS housing_median_age FROM files.home_table GROUP BY ocean_proximity;";
    const medianData = await MindsDB.SQL.runQuery(query);
    const homeModel = await MindsDB.Models.getModel("home_model", "mindsdb");

    const longitude = req.body.longitude;
    const latitude = req.body.latitude;
    const housing_median_age = req.body.housing_median_age;
    const total_rooms = req.body.total_rooms;
    const total_bedrooms = req.body.total_bedrooms;
    const population = req.body.population;
    const households = req.body.households;
    const median_income = req.body.median_income;
    const ocean_proximity = req.body.ocean_proximity;

    const queryOptions = {
      where: [
        `longitude='${longitude}'`,
        `latitude=${latitude}`,
        `housing_median_age=${housing_median_age}`,
        `total_rooms=${total_rooms}`,
        `total_bedrooms=${total_bedrooms}`,
        `population=${population}`,
        `households=${households}`,
        `median_income=${median_income}`,
        `ocean_proximity='${ocean_proximity}'`,
      ],
    };

    const prediction = await homeModel.query(queryOptions);
    const homePrice = prediction.value;
    console.log(medianData);
    res.render("result", { homePrice, ocean_proximity, medianData });
  } catch (error) {
    console.error("Failed to make home price prediction:", error);
    res.status(500).send("Failed to make home price prediction.");
  }
});
// predit the CA home value End

async function connectToMindsDB() {
  try {
    await MindsDB.connect({
      host: "http://localhost:47334",
    });
    console.log("Successfully connected to MindsDB!");

    const query1 =
      "SELECT ocean_proximity AS ocean_proximity, AVG(total_rooms/households) AS avg_rooms_per_household FROM files.home_table GROUP BY ocean_proximity";
    const data1 = await MindsDB.SQL.runQuery(query1);

    const query2 =
      "SELECT median_income AS median_income, median(median_house_value) AS median_house_price, ocean_proximity AS ocean_proximity FROM files.home_table GROUP BY ocean_proximity, median_income";
    const data2 = await MindsDB.SQL.runQuery(query2);

    return {
      data1: data1.rows,
      data2: data2.rows,
    };
  } catch (error) {
    console.error("Failed to connect to MindsDB:", error);
    return {
      data1: [],
      data2: [],
    };
  }
}

app.get("/chart1", async (req, res) => {
  try {
    const data = await connectToMindsDB();
    res.json(data.data1);
  } catch (error) {
    console.error("Failed to fetch data for chart 1:", error);
    res.json([]);
  }
});

app.get("/chart2", async (req, res) => {
  try {
    const data = await connectToMindsDB();
    res.json(data.data2);
  } catch (error) {
    console.error("Failed to fetch data for chart 2:", error);
    res.json([]);
  }
});

app.listen(3000 , () => {
  console.log("Server started on port 3000");
});
