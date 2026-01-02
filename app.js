const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`)
    })
  } catch (error) {
    console.error('Error opening database:', error)
    process.exit(1)
  }
}

initializeDbAndServer()

app.get('/movies/', async (req, res) => {
  try {
    const query = `SELECT movie_name AS movieName FROM movie;`
    const movies = await db.all(query)
    res.json(movies)
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

app.post('/movies/', async (req, res) => {
  try {
    const {directorId, movieName, leadActor} = req.body
    const insertQuery = `
      INSERT INTO movie (director_id, movie_name, lead_actor)
      VALUES (?, ?, ?);
    `
    await db.run(insertQuery, [directorId, movieName, leadActor])
    res.send('Movie Successfully Added')
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

app.get('/movies/:movieId/', async (req, res) => {
  try {
    const {movieId} = req.params
    const getQuery = `
      SELECT
        movie_id AS movieId,
        director_id AS directorId,
        movie_name AS movieName,
        lead_actor AS leadActor
      FROM movie
      WHERE movie_id = ?;
    `
    const movie = await db.get(getQuery, [movieId])
    if (movie) {
      res.json(movie)
    } else {
      res.status(404).send('Movie Not Found')
    }
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

app.put('/movies/:movieId/', async (req, res) => {
  try {
    const {movieId} = req.params
    const {directorId, movieName, leadActor} = req.body
    const updateQuery = `
      UPDATE movie
      SET director_id = ?, movie_name = ?, lead_actor = ?
      WHERE movie_id = ?;
    `
    const result = await db.run(updateQuery, [
      directorId,
      movieName,
      leadActor,
      movieId,
    ])
    if (result.changes === 0) {
      res.status(404).send('Movie Not Found')
    } else {
      res.send('Movie Details Updated')
    }
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

app.delete('/movies/:movieId/', async (req, res) => {
  try {
    const {movieId} = req.params
    const deleteQuery = `
      DELETE FROM movie
      WHERE movie_id = ?;
    `
    const result = await db.run(deleteQuery, [movieId])
    if (result.changes === 0) {
      res.status(404).send('Movie Not Found')
    } else {
      res.send('Movie Removed')
    }
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

app.get('/directors/', async (req, res) => {
  try {
    const query = `
      SELECT director_id AS directorId, director_name AS directorName
      FROM director;
    `
    const directors = await db.all(query)
    res.json(directors)
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

app.get('/directors/:directorId/movies/', async (req, res) => {
  try {
    const {directorId} = req.params
    const query = `
      SELECT movie_name AS movieName
      FROM movie
      WHERE director_id = ?;
    `
    const movies = await db.all(query, [directorId])
    res.json(movies)
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

// Export the express instance (CommonJS default export)
module.exports = app
