const express = require('express');
const cors = require('cors');

let blogs = [
  {
    id: 1,
    content: 'HTML is easy',
    date: '2019-05-30T17:30:31.098Z',
    important: true,
  },
  {
    id: 2,
    content: 'Browser can execute only Javascript',
    date: '2019-05-30T18:39:34.091Z',
    important: false,
  },
  {
    id: 3,
    content: 'GET and POST are the most important methods of HTTP protocol',
    date: '2019-05-30T19:20:14.298Z',
    important: true,
  },
];

const app = express();

const requestLogger = (request, response, next) => {
  console.log('Method', request.method);
  console.log('Path', request.path);
  console.log('Body', request.body);
  console.log('---');
  next();
};

app.use(express.json());
app.use(requestLogger);
app.use(cors());

const generateID = () => {
  const maxId = blogs.length > 0 ? Math.max(...blogs.map((n) => n.id)) : 0;

  return maxId;
};

app.get('/', (request, response) => {
  response.send(`<h1>Hello World</h1`);
});

app.get('/api/blogs', (request, response) => {
  response.json(blogs);
});

app.get('/api/blogs/:id', (request, response) => {
  const id = parseInt(request.params.id);
  const blog = blogs.find((blog) => blog.id === id);

  if (blogs) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});

app.delete('/api/blogs/:id', (request, response) => {
  const id = parseInt(request.params.id);
  blogs = blogs.filter((blog) => blog.id !== id);

  response.status(204).end();
});

app.post('/api/blogs', (request, response) => {
  const body = request.body;

  if (!body.content) {
    return response.status(400).json({
      error: 'content missing',
    });
  }

  const blog = {
    content: body.content,
    important: body.important || false,
    date: new Date(),
    id: generateID(),
  };

  blogs = blogs.concat(blog);

  response.json(blog);
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.use(unknownEndpoint);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
