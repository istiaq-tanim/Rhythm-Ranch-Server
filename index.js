const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express()


require('dotenv').config()
const port = process.env.PORT || 5000;
const stripe = require("stripe")("sk_test_51NEZAfHvJD5yKaqm2WPRS4xsJgLABv05GevLiiX54kyFT2uq2ddj1qwIlbwYzP5Ls5mNyb8PzBr39HhOg797jEb1002AUPqZB8")
app.use(cors());
app.use(express.json());

const verifyJWTToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  const token = authorization.split(" ")[1]

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    console.log(decoded)
    next();
  });
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

    const classesCollection = client.db("summerDB").collection("classes")
    const usersCollection = client.db("summerDB").collection("users")
    const cartCollection = client.db("summerDB").collection("carts")
    const paymentCollection = client.db("summerDB").collection("payments")
    const enrollCollection = client.db("summerDB").collection("enrolls")



    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign({ data: user }, process.env.ACCESS_TOKEN, { expiresIn: '7d' });
      res.send({ token })
    })
    // classes apis


    app.get("/popularCourses", async (req, res) => {

      const result = await classesCollection.find().sort({ enroll_student: -1 }).limit(6).toArray()
      res.send(result)

    })

    app.get("/courses", async (req, res) => {
      const result = await classesCollection.find().toArray()
      res.send(result)

    })

    app.post("/courses", async (req, res) => {
      const addCourses = req.body;
      const result = await classesCollection.insertOne(addCourses)
      res.send(result)
    })

    app.patch("/courses/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: "approved"
        }
      };
      const result = await classesCollection.updateOne(query, updateDoc)
      res.send(result)
    })


    app.patch("/courses/deny/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: "denied"
        }
      };
      const result = await classesCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.post("/courses/feedback/:id", verifyJWTToken, async (req, res) => {
      const adminFeedback = req.body.feedback;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          feedback: adminFeedback
        }
      };
      const result = await classesCollection.updateOne(query, updateDoc)
      res.send(result)

    })

    app.get("/instructorClasses", verifyJWTToken , async (req, res) => {
      const email = req.query.email
      if (!email) {
        res.send([]);
      }
      const decodedEmail = req.decoded.data.email;
      console.log(decodedEmail)
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email }
      const result = await classesCollection.find(query).toArray()
      res.send(result)
    })




    // users apis

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query)
      console.log("existing user", existingUser)
      if (existingUser) {
        return res.send({ message: "User Already Exists" })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })



    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await usersCollection.findOne(query)
      res.send(result)
    })
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: "admin"
        }
      };
      const result = await usersCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: "instructor"
        }
      };
      const result = await usersCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.get("/instructor/:role", async (req, res) => {
      const role = req.params.role;
      const query = { role: role }
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })


    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    // cart apis

    app.get("/carts", verifyJWTToken, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([])
      }
      
      const decodedEmail = req.decoded.data.email;

      console.log(decodedEmail)
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email }
      const result = await cartCollection.find(query).toArray()
      res.send(result)
    })

    app.post("/carts", async (req, res) => {
      const cart = req.body;
      const result = await cartCollection.insertOne(cart)
      res.send(result)
    })

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(filter)
      res.send(result)
    })

    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"]
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });

    })

    // payment api created

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      console.log(req.body)
      const result = await paymentCollection.insertOne(payment)
      const itemId = payment.class_id;
      const email = payment.email
      const query = { class_id: itemId, email: email };

      const enrollClass = await cartCollection.findOne(query)

      const enrolledClass = await enrollCollection.insertOne(enrollClass)

      const deleteResult = await cartCollection.deleteOne(query);
      if (deleteResult.deletedCount > 0) {
        const updateResult = await classesCollection.updateOne(
          { _id: new ObjectId(itemId) },
          {
            $inc: {
              available_set: -1, enroll_student: 1
            }
          }
        );
        res.send({ result, deleteResult, updateResult, enrolledClass })
      }

    })

    app.get("/paymentHistory", verifyJWTToken, async (req, res) => {
      const email = req.query.email;

      const decodedEmail = req.decoded.data.email;

      console.log(decodedEmail)
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email }
      const result = await paymentCollection.find(query).sort({ date: -1 }).toArray()
      res.send(result)
    })

    //enrolls api

    app.get("/enroll/:email", verifyJWTToken, async (req, res) => {
      const email = req.params.email;

      const decodedEmail = req.decoded.data.email;

      console.log(decodedEmail)
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email }
      const result = await enrollCollection.find(query).toArray()
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