const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}
initializeDBAndServer()
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const checkingQuery = `select * from User where username='${username}'`
  const dbUser = await db.get(checkingQuery)
  console.log(dbUser)
  if (dbUser === undefined && password.length >= 5) {
    const query = `insert into User(username,name,password,gender,location) values(
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    )`
    await db.run(query)
    response.send('User created successfully')
  } else if (dbUser !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  }
})
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  const samePass = await bcrypt.compare(oldPassword, dbUser.password)
  if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else if (samePass) {
    const hashedPassword = await bcrypt.hash(request.body.newPassword, 10)
    const query = `update user set password ='${hashedPassword}' where username ='${username}'`
    await db.run(query)
    response.send('Password updated')
  }else {
    response.status(400)
    response.send('Invalid current password')
  }
})
module.exports = app
