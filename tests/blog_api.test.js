const supertest = require('supertest');
const mongoose = require('mongoose');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');

// const bcrypt = require('bcrypt');

beforeEach(async () => {
  await Blog.deleteMany({});

  await User.deleteMany({});

  await Blog.insertMany(helper.initialBlogs);
});

describe('when some blogs are saved', () => {
  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs');
    expect(response.body.length).toBe(helper.initialBlogs.length);
  });

  test('id field is properly names', async () => {
    const response = await api.get('/api/blogs');
    expect(response.body[0].id).toBeDefined();
  });
});

test('a blog can be edited', async () => {
  const [aBlog] = await helper.blogsInDb();

  const editedBlog = { ...aBlog, likes: aBlog.likes + 1 };

  await api.put(`/api/blogs/${aBlog.id}`).send(editedBlog).expect(200);

  const blogsAtEnd = await helper.blogsInDb();
  const edited = blogsAtEnd.find((blog) => blog.url === aBlog.url);
  expect(edited.likes).toBe(aBlog.likes + 1);
});

describe('when a blog is posted to api', () => {
  let headers;

  beforeEach(async () => {
    const newUser = {
      username: 'TESTER',
      name: 'Johno',
      password: 'password123',
    };

    await api.post('/api/users').send(newUser);

    const result = await api.post('/api/login').send(newUser);

    headers = {
      Authorization: `bearer ${result.body.token}`,
    };
  });

  test('it is saved to the db', async () => {
    const newBlog = {
      title: 'test title',
      author: 'test author',
      url: 'test url',
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set(headers)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContain('test title');
  });
});

afterAll(() => {
  mongoose.connection.close();
});
