const express = require('express')
const cors = require('cors')
var admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hm8fata.mongodb.net/?appName=Cluster0`;
const decoded = Buffer.from(process.env.FB_SERVICE_KEY,
  'base64'
).toString('utf8');
var serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});






async function run() {
  try {
    await client.connect();
    const db=client.db("bloodBrigade");
    const donorCollection=db.collection("donors");
    const requestCollection=db.collection("requests");

    const verifyFBToken= async (req,res,next)=>
    {
      const token=req.headers.authorization;
  if(!token)
  {
    return res.status(401).send({message:"Unauthorized access"});
  }
  try{
    const firebaseToken=token.split(" ")[1];
    const decodedToken=await admin.auth().verifyIdToken(firebaseToken);
    req.decodedEmail=decodedToken.email;
    next();
  }
  catch{
    return res.status(401).send({message:"Unauthorized access"});
  }

    }

    
app.get('/', (req, res) => {
  res.send('Hello Hero!')
})

app.get('/donors',verifyFBToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const totalCount = await donorCollection.countDocuments();
  const donors = await donorCollection.find().skip(skip).limit(limit).toArray();
  res.send({donors,totalPages: Math.ceil(totalCount / limit),currentPage: page,totalCount});
});

app.get('/requests',verifyFBToken, async (req, res) => {
   const page = parseInt(req.query.page) || 1; 
   const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit; 
    const query={};
    query.status="pending";
    const totalCount = await requestCollection.countDocuments(query); 
    const requests = await requestCollection.find(query).skip(skip).limit(limit).toArray(); 
    res.send({ requests, totalPages: Math.ceil(totalCount / limit), currentPage: page, totalCount }); 
  });

app.get('/myRequests',verifyFBToken,async(req,res)=>
{
  const email=req.query.email;
  if(req.decodedEmail!==email)
  {
    return res.status(403).send({message:"Forbidden access"});
  }
  const query={email:email};
  const cursor=requestCollection.find(query).sort({_id:-1});
  const result=await cursor.toArray();
  res.send(result);

})
app.get('/donor/profile',verifyFBToken,async(req,res)=>
{
const email=req.query.email;
const query={email:email};
if(req.decodedEmail!==email)
{
  return res.status(403).send({message:"Forbidden access"});
}

const result=await donorCollection.findOne(query);
res.send(result);
})
app.get('/donor',verifyFBToken,async(req,res)=>
{
    const email=req.query.email;
    if(req.decodedEmail!==email)
    {
return res.status(403).send({message:"Forbidden access"});
    }
    const query={email:email};
    const result=await donorCollection.findOne(query);
    if(result)
    {
        res.send(result);
    }
   else
   {
    res.send({message:"No donor found"});
   }
})
app.get('/eligbleDonors',verifyFBToken,async(req,res)=>
{

  const currentDistrict=req.query.currentDistrict;
    const bloodGroup=req.query.bloodGroup;
    const query={currentDistrict:currentDistrict,bloodGroup:bloodGroup};
    console.log(query);
    const cursor=donorCollection.find(query);
    const result=await cursor.toArray();
    res.send(result);

});

app.post('/request-blood',verifyFBToken,async(req,res)=>
{
  const request=req.body;
  const result=await requestCollection.insertOne(request);
  res.send(result);

})

app.post('/become-donor',verifyFBToken,async(req,res)=>
{
    const donor=req.body;
    const result=await donorCollection.insertOne(donor);
    res.send(result);

})

app.patch('/donor/profile',verifyFBToken,async(req,res)=>
{
    const email=req.query.email;
    if(req.decodedEmail!==email)
    {
      return res.status(403).send({message:"Forbidden access"});
    }
    const updatedData=req.body;
    const filter={email:email};
    const updateDoc={
        $set: updatedData
    };
    const result=await donorCollection.updateOne(filter,updateDoc);
    res.send(result);
})
app.patch('/updateRequestStatus',verifyFBToken,async(req,res)=>
{
  const id=req.query.id;
  const updatedData=req.body;
  const filter={_id:new ObjectId(id)};
  const updateDoc={
      $set:
      {
        status:updatedData.status,
        fullFilled_Date:updatedData.fullFilled_Date
      } 
  };
  const result=await requestCollection.updateOne(filter,updateDoc);
  res.send(result);
})

app.patch('/cancelRequestStatus',verifyFBToken,async(req,res)=>
{
  const id=req.query.id;
  const updatedData=req.body;
  const filter={_id:new ObjectId(id)};
  const updateDoc={
      $set:
      {
        status:updatedData.status,
        canceled_Date:updatedData.canceled_Date
      } 
  };
  const result=await requestCollection.updateOne(filter,updateDoc);
  res.send(result);
})
   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})