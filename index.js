const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://oguzhan:02541768@cluster0.ik5jmgh.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
let userModel = mongoose.model("userModel", userSchema);

let exerciseSchema = new mongoose.Schema({
  description: { type: String },
  duration: { type: Number },
  date: { type: Date, default: Date.now },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel"
  }
})

let exerciseModel = mongoose.model("exerciseModel", exerciseSchema);

let logSchema = new mongoose.Schema({
  count: { type: Number },
  log: { type: Array },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel"
  }
})

let logModel =mongoose.model("logModel",logSchema);




app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get('/api/users',(req,res)=>{
  userModel.find().then((data)=>{
    console.log("all users:",data);
    res.json(data);
  }).catch((err)=>{
    console.log(err);
  })

})

app.post('/api/users',(req,res)=>{
  const username = req.body.username;
  const newUser = new userModel({
    username:username
  })
  newUser.save().then((data)=>{
    console.log("user:",data);
    res.json({
      username:data.username,
      _id:data._id
    })
  }).catch((err)=>{
    console.log(err);
  })
  
})

app.post('/api/users/:_id/exercises',async (req,res)=>{
  try{
  
    const user = await userModel.findById(req.params._id);
    if(!user){
      res.send({Error:"error handling for finding user (There is no such a user)"});
      return;
    }
    else{
      const description = req.body.description;
      const duration = parseInt(req.body.duration);
      const date =req.body.date;
      console.log("_id:",req.params._id);
      console.log("description:",req.body.description);
      console.log("date:",date);
      console.log("username:",user.username);
      
      //Saving exercise
      const newExercise = new exerciseModel({
        description:req.body.description,
        duration:parseInt(req.body.duration),
        date:date ? new Date(date):new Date(),
        userId:req.params._id
      })
      newExercise.save().then((data)=>{
        res.json({
          _id:req.params._id,
          username:user.username,
          date:date ? new Date(date).toDateString() :new Date().toDateString(),
          duration:duration,
          description:req.body.description
        })
      })
      
    }
  
  }
  catch(err){
    res.send(err);
    
  }
  


})
app.get('/api/users/:_id/logs',async (req,res)=>{
  try{
    const from= req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;
    const user = await userModel.findById(req.params._id);
    if(!user){
      res.send("There is no such a user");
      return;
    }
    let dateobj={};
    
    if(from){
      dateobj["$gte"]=new Date(from);
      console.log("burası4")
    }
    if(to){
      dateobj["$lte"]=new Date(to);
    }
    let filter={userId:req.params._id}
    
    if(from||to){      
      filter.date=dateobj;
    }
    console.log("dateobj",dateobj)
    const exercise = await exerciseModel.find(filter).limit(+limit ?? 500);

    console.log("exercise",exercise) 
    console.log("burası3")
    res.send({
      _id:user._id,
      username:user.username,
      count:exercise.length,
      log:exercise.map((data)=>{
        return{
          description:data.description,
          duration:data.duration,
          date:data.date.toDateString()
        }
      })
    })

  }
  catch(err){
    res.send(err);
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

