const express = require("express")
const router = express.Router()
const Post = require("../../models/Post")
const Profile = require("../../models/Profile")
const Users = require("../../models/User")
const auth = require("../../middleware/auth")
const {check, validationResult} = require("express-validator")

// @route POST /api/posts
// @desc add posts data
// @access private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()})
      }
      const user = await User.findById(req.user.id).select("-password")
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      })
      const post = await newPost.save()
      res.json(post)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  }
)

// @route 						GET /api/posts
// @description       get all posts
// @access 						private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({date: -1})
    res.json(posts)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route 						GET /api/posts/:id
// @description       get post by ID
// @access 						private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      res.status(404).json({msg: "post not found"})
    }
    res.json(post)
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") {
      return res.status(404).json({msg: "Post not found"})
    }
    res.status(500).send("Server error")
  }
})

// @route 						DELETE /api/posts/:id
// @description       delete a post
// @access 						private

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (err.kind === "ObjectId") {
      return res.status(404).json({msg: "post not found"})
    }
    // check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({msg: "user not authorised"})
    }
    await post.remove()
    res.json({msg: "Post removed"})
  } catch (err) {
    console.error(err.message)
    if (err.kind === "ObjectId") res.status(500).send("Server error")
  }
})

// @route       PUT /api/posts/like/:id
// @description like a post
// @access private

router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    // check post has been already liked or not
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({msg: "Post already liked"})
    }
    post.likes.unshift({user: req.user.id})
    await post.save()
    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route       PUT /api/posts/unlike/:id
// @description like a post
// @access private

router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    // check post has been already liked or not
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({msg: "Post not at been liked"})
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id)
    post.likes.splice(removeIndex, 1)
    await post.save()
    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route POST /api/posts/comment/:id
// @desc add posts comments data
// @access private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()})
      }
      const user = await User.findById(req.user.id).select("-password")
      const post = await Post.findById(req.params.id)

      const newComment = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      })
      post.comments.unshift(newComment)
      await post.save()
      res.json(post)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  }
)

// @route DELETE /api/posts/comments/:id/:comment_id
// @desc delete comment
// @access private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    // pull out comment
    const comment = await post.comments.find(
      (comment) => comment.id === req.params.comment_id
    )
    // make sure comment exists
    if (!comment) {
      return res.status(404).json({msg: "Comment does not exist"})
    }
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({msg: "User not authorised"})
    }
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id)
    post.comments.splice(removeIndex, 1)
    await post.save()
    res.json(post.comments)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

module.exports = router
