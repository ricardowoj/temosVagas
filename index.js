const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const port = process.env.PORT || 3000

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', async(request, response) =>{
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')
    const categoriasDb = await db.all('select * from categorias;')
    const categorias = categoriasDb.map(cat => {
        return {
            ...cat,
            vagas: vagas.filter( vagas => vagas.categoria === cat.id)
        }
    })
    response.render('home', { categorias })
})

app.get('/vaga/:id', async(request, response) => {
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id ='+request.params.id)
    response.render('vaga', { vaga })
})

app.get('/admin', (request, response) => {
    response.render('admin/home-admin')
})

app.get('/admin/vagas', async(request, response) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')
    response.render('admin/vagas', { vagas })
})

app.get('/admin/vagas/delete/:id', async(request, response) => {
    const db = await dbConnection
    await db.run('delete from vagas where id = ' + request.params.id + '')
    response.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async(request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    response.render('admin/nova-vaga', { categorias })
})

app.post('/admin/vagas/nova', async(request, response) => {
    const { titulo, descricao, categoria } = request.body
    const db = await dbConnection
    await db.run(`insert into vagas(titulo, descricao, categoria) values('${titulo}', '${descricao}', '${categoria}')`)
    response.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async(request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id = '+request.params.id)
    response.render('admin/editar-vaga', { categorias, vaga })
})

app.post('/admin/vagas/editar/:id', async(request, response) => {
    const { titulo, descricao, categoria } = request.body
    const id = request.params.id
    const db = await dbConnection
    await db.run(`update vagas set categoria = '${categoria}', titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`)
    response.redirect('/admin/vagas')
})

app.get('/admin/categorias', async(request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias;')
    response.render('admin/categorias', { categorias })
})

app.get('/admin/categorias/delete/:id', async(request, response) => {
    const db = await dbConnection
    await db.run('delete from categorias where id = ' + request.params.id + '')
    response.redirect('/admin/categorias')
})

app.get('/admin/categorias/editar/:id', async(request, response) => {
    const db = await dbConnection
    const categoria = await db.get('select * from categorias where id= ' +request.params.id)
    response.render('admin/editar-categoria', { categoria })
})

app.post('/admin/categorias/editar/:id', async(request, response) => {
    const { categoria } = request.body
    const id = request.params.id
    const db = await dbConnection
    await db.run(`update categorias set categoria = '${categoria}' where id = ${id}`)
    response.redirect('/admin/categorias')
})

app.get('/admin/categoria/nova', async(request, response) => {
    const db = await dbConnection
    const categorias = await db.all('select * from Categorias')
    response.render('admin/nova-categoria', { categorias })
})

app.post('/admin/categoria/nova', async(request, response) => {
    const { categoria } = request.body
    const db = await dbConnection
    await db.run(`insert into categorias(categoria) values('${categoria}')`)
    response.redirect('/admin/categorias')
})

const init = async() => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
}
init()

app.listen(port, (error) => {
    if(error){
        console.log('Não foi possível acessar ao servidor...')
    }else{
        console.log('Servidor rodando...')
    }
})