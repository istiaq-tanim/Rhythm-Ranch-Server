const express = require('express')
const cors = require('cors');
const app = express()

require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjebueb.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
   
    const classCollections=client.db("summerDB").collection("classes")
    const instructorCollections=client.db("summerDB").collection("instructors")

    // classes collections 


    app.get("/courses",async(req,res)=>{
     
       const result=await classCollections.find().sort({enroll_student:-1}).limit(6).toArray()
       res.send(result)

    })

    //instructor collections
    app.get("/instructors",async(req,res)=>{
      const result=await instructorCollections.find().limit(6).toArray()
      res.send(result)

   })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Summer is getting hotter!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})