const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);

const bcrypt = require('bcrypt');

const helper = require('./test_helper');
const Blog = require('../models/blog');
const User = require('../models/user');

beforeEach(async () => {
  await Blog.deleteMany({});

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

  test('a blog can be edited', async () => {
    const [aBlog] = await helper.blogsInDb();
    const editedBlog = { ...aBlog, likes: aBlog.likes + 1 };
    await api.put(`/api/blogs/${aBlog.id}`).send(editedBlog).expect(200);
    const blogsAtEnd = await helper.blogsInDb();
    const edited = blogsAtEnd.find((blog) => blog.url === aBlog.url);

    expect(edited.likes).toBe(aBlog.likes + 1);
  });
});

describe('when a blog is posted to api', () => {
  test('it is saved to the db', async () => {
    const newBlog = {
      title: 'test title',
      author: 'test author',
      url: 'test url',
      likes: 5,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContain('test title');
  });

  test('likes get value 0 as default', async () => {
    const newBlog = {
      title: 'test title',
      author: 'test author',
      url: 'test url',
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const added = blogsAtEnd.find((blog) => blog.title === 'test title');
    expect(added.likes).toBe(0);
  });

  test('operation fails with url missing', async () => {
    const newBlog = {
      title: 'test title',
      author: 'test author',
    };
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
      .expect('Content-Type', /application\/json/);
  });
});

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(500)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('duplicate key');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
