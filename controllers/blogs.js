const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');

const Blog = require('../models/blog');
const User = require('../models/user');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user');

  response.json(blogs);
});

// blogsRouter.get('/:id', async (request, response) => {
//   const blog = await Blog.findById(request.params.id).populate('user');

//   if (blog) {
//     response.json(blog);
//   } else {
//     response.status(404).end();
//   }
// });

blogsRouter.get('/:slug', async (request, response) => {
  const blog = await Blog.findOne({ slug: request.params.slug });
  console.log(blog);
  if (blog) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body);

  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'Token missing or invalid.' });
  }

  const user = await User.findById(decodedToken.id);

  if (!blog.url || !blog.title) {
    return response.status(400).send({ error: 'title or url missing' });
  }

  if (!blog.likes) {
    blog.likes = 0;
  }

  if (!blog.comments) {
    blog.comments = [];
  }

  blog.user = user;

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog);
});

blogsRouter.post('/:id/comments', async (request, response) => {
  console.log(request.body);
  const newComment = request.body.comment;
  console.log(newComment);
  const blog = await Blog.findById(request.params.id);

  blog.comments = blog.comments.concat(newComment);

  const savedBlog = await blog.save();

  response.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);
  const blog = await Blog.findById(request.params.id);

  if (blog.user.toString() !== user.id.toString()) {
    return response
      .status(401)
      .json({ error: 'only the author can delete blog' });
  }

  await blog.remove();
  user.blogs = user.blogs.filter(
    (blog) => blog.id.toString() !== request.params.id.toString()
  );
  await user.save();
  response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    comments: body.comments,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });

  response.json(updatedBlog);
});

module.exports = blogsRouter;
