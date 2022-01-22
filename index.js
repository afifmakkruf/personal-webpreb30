const express = require('express')
const hbs = require('hbs')
const bcrypt = require('bcrypt')
const flash = require('express-flash')
const session = require('express-session')
const cool = require('cool-ascii-faces')

const db = require('./connection/db') 
const upload = require('./middlewares/fileUpload')

const app = express()
const PORT = process.env.PORT || 5500

app.set('view engine', 'hbs') 

app.use('/public',express.static(__dirname + '/public')) 
app.use('/uploads',express.static(__dirname + '/uploads')) 
app.use(express.urlencoded({extended: false}))
app.use(flash())

app.use(
    session({
        cookie: {
            maxAge: 2 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: 'secretValue'
    })
)

hbs.registerPartials(__dirname + '/views/partials')

// hightlited menu
let active = 'menu-active'

function getFullTime(time) {
    let month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    let date = time.getDate()
    let monthIndex = time.getMonth()
    let year = time.getFullYear()
    let hours = time.getHours()
    let minutes = time.getMinutes()

    if (hours < 10) {
        hours = "0" + hours
    }

    if (minutes < 10) {
        minutes = "0" + minutes
    }

    return `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`
}

function getDistanceTime(time) {
  
    let timePost = time
    let timeNow = new Date()
  
    let distance = timeNow - timePost
    
    let milisecond = 1000  
    let secondInHours = 3600 
    let hoursInDay = 23 
  
    let minutes = 60
    let seconds = 60
  
    let distanceYear = Math.floor(distance / (milisecond * secondInHours * hoursInDay * 365))
    let distanceMonth = Math.floor(distance / (milisecond * secondInHours * hoursInDay * 30))
    let distanceWeek = Math.floor(distance / (milisecond * secondInHours * hoursInDay * 6))
    let distanceDay = Math.floor(distance / (milisecond * secondInHours * hoursInDay)) // untuk mendapatkan hari
    let distanceHours = Math.floor(distance / (milisecond * minutes * seconds)) // untuk mendaptkan jam
    let distanceMinutes = Math.floor(distance / (milisecond * seconds)) // untuk mendapatkan menit
    let distanceSeconds = Math.floor(distance / milisecond) // untuk mendapatkan detik
  
  
    if (distanceYear >= 1) {
      return `${distanceYear} year ago`
    } else if (distanceMonth >= 1) {
      return `${distanceMonth} month ago`
    } else if (distanceWeek >= 1) {
      return `${distanceWeek} week ago` 
    } else if (distanceDay >= 1) {
      return `${distanceDay} day ago`
    } else if (distanceHours >= 1) {
      return `${distanceHours} hours ago`
    } else if (distanceMinutes >= 1) {
      return `${distanceMinutes} minutes ago`
    } else {
      return `${distanceSeconds} seconds ago`
    }
    
}
  

app.get('/', (req, res) => {

    db.connect((error, client, done) => {
        if (error) throw error

        client.query('SELECT experience, EXTRACT (YEAR FROM year) AS YEAR FROM tb_experiences', (error, result) => {
            if (error) throw error

            let dataExp = result.rows

            res.render('index', {
                dataExp,
                activeHome: active,
                isLogin: req.session.isLogin,
                user: req.session.user
            })
        })

        done()
    })

    // res.render('index', {
    //         // dataExp,
    //         activeHome: active,
    //         isLogin: req.session.isLogin,
    //         user: req.session.user
    //     })
})

app.get('/blog-detail/:id', (req, res, done) => {

    let id = req.params.id

    db.connect((error, client, done) => {
        if (error) throw error

        let query = `SELECT tb_blog.id, tb_blog.author_id, tb_blog.title, tb_blog.image, tb_blog.content, tb_blog.post_date, tb_user.name AS author
        FROM tb_blog LEFT JOIN tb_user ON tb_blog.author_id = tb_user.id WHERE tb_blog.id = ${id}`
        client.query(query, (error, result) => {
            if (error) throw error

            let blog = result.rows[0]


            res.render('blog-detail', {
                dataBlogs: blog,
                activeBlog: active,
                isLogin: req.session.isLogin,
                user: req.session.user,
                fulltime: getFullTime(new Date(blog.post_date))
            })
        })
        done()
    })
    
})


app.get('/add-blog', (req, res) => {

    if (!req.session.isLogin) {
        req.flash('danger', 'Please login !')
        res.redirect('/login')
    }

    res.render('add-blog', {
        activeBlog: active,
        isLogin: req.session.isLogin,
        user: req.session.user
    })
    
})


app.post('/add-blog', upload.single('inputImage'), (req, res) => {
    let { title, content } = req.body
    let image = req.file.filename
    let authorId = req.session.user.id

    let query = `INSERT INTO tb_blog (title, content, image, author_id) 
                VALUES ('${title}', '${content}', '${image}', '${authorId}')`
    db.connect((error, client, done) => {
        if (error) throw error

        client.query(query, (error, result) => {
            if (error) throw error

            res.redirect('/blog')
        })
        done()
    })
    
})


app.get('/delete-blog-post/:id', (req, res) => {
    let { id } = req.params

    db.connect((error, client, done) => {
        if (error) throw error

        client.query(`DELETE FROM tb_blog WHERE id = ${id}`, (error, resutl) => {

            res.redirect('/blog')
        })
        done()
    })
    
}) 


app.get('/blog', (req, res) => {

    db.connect((error, client, done) => {

        if (error) throw error

        let query = `SELECT tb_blog.id, tb_blog.author_id, tb_blog.title, tb_blog.image, tb_blog.content, tb_blog.post_date, tb_user.name AS author
        FROM tb_blog LEFT JOIN tb_user ON tb_blog.author_id = tb_user.id ORDER BY tb_blog.post_date ASC;`
        client.query(query, (error, result) => {
            if (error) throw error
            let blog = result.rows

            let dataBlogs = blog.map((blog) => {
                return {
                ...blog,
                distance: getDistanceTime(new Date(blog.post_date)),
                fulltime: getFullTime(new Date(blog.post_date)),
                isLogin: req.session.isLogin

                }
            })

            res.render('blog', {
                isLogin: req.session.isLogin,
                user: req.session.user,
                blogs: dataBlogs,
                activeBlog: active,
                user: req.session.user,
                distance: getDistanceTime(new Date(blog.post_date)),
                fulltime: getFullTime(new Date(blog.post_date))
            })
        })
        done()
    })
    
})


app.get('/edit-blog/:id', (req, res) => {
    let { id } = req.params

    let query = `SELECT * FROM tb_blog WHERE id = ${id}`
    db.connect((error, client, done) => {
        if (error) throw error

        client.query(query, (error, result) => {
            let data =  result.rows[0]

            res.render('edit-blog', {
                title: data.title,
                content: data.content,
                image: data.image,
                id : id,
                activeBlog: active,
                isLogin: req.session.isLogin,
                user: req.session.user
            })
        })
        done()
    })
    
})


app.post('/edit-blog/:id', upload.single('inputImage'), (req, res) => {
    let { id } = req.params
    let { title, content, oldImage } = req.body
    let image = req.file.filename
    
    console.log(oldImage);

    if(typeof req.file.filename === 'undefined') {
        image = oldImage
    }


    let query = `UPDATE tb_blog 
    SET title='${title}', content='${content}', image='${image}' WHERE id = ${id}`
    db.connect((error, client, done) => {

        client.query(query, (error, result) => {

            res.redirect('/blog')
        })
        done()
    })
    
})


app.get('/contact', (req, res) => {
    res.render('contact', {
        isLogin: req.session.isLogin,
        user: req.session.user
    })
})


app.get('/register', (req, res) => {

    res.render('register', {
        activeRegister: active,
        isLogin: req.session.isLogin,
        user: req.session.user
    })
    
})


app.post('/register', (req, res) => {

    let { name, email, password } = req.body
    const hashedPassword = bcrypt.hashSync(password, 10)

    let query = `INSERT INTO tb_user (name, email, password) VALUES ('${name}', '${email}', '${hashedPassword}')`
    db.connect((error, client, done) => {
        if (error) throw error

        client.query(query, (error, result) => {
            if (error) throw error

            if(result.rows.length == 0) {

                res.redirect('/register')

            } else {

                res.redirect('/blog')

            }
        })
        done()
    })
    
})


app.get('/login', (req, res) => {

    res.render('login', {
        activeLogin: active,
        isLogin: req.session.isLogin,
        user: req.session.user
    })

})


app.post('/login', (req, res) => {

    let { email, password } = req.body

    let query = `SELECT * FROM tb_user WHERE email = '${email}'`

    db.connect((error, client, done) => {
        if (error) throw error

        client.query(query, (error, result) => {
            if (error) throw error  

            if(result.rows.length == 0) {
                req.flash('danger', 'Email belum terdafatar')

                return res.redirect('/login')

            }

            let isMatch = bcrypt.compareSync(password, result.rows[0].password)


            if(isMatch) {

                req.session.isLogin = true
                req.session.user = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email
                }

                req.flash('success', 'Login is succesful')

                res.redirect('/blog')

            }else{
                req.flash('danger', 'Password is incorrect')

                res.redirect('/login')

            }

        })
        done()
    })
    
})


app.get('/logout', (req, res) => {
    req.session.destroy()

    res.redirect('/')
}) 

app.get('/cool', (req, res) => res.send(cool()))

app.listen(PORT, () => {
    console.log("Listening on port " + PORT)
})