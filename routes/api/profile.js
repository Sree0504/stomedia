const express = require("express")
const {check, validationResult} = require("express-validator")
const request = require("request")
const config = require("config")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const User = require("../../models/User")

// @route 						GET /api/pofile/me
// @description       Get current user's profile
// @access 						Private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({user: req.user.id}).populate(
      "user",
      ["name", "avatar"]
    )
    if (!profile) {
      return res.status(400).json({msg: "There is no profile for this user"})
    }
    res.json(profile)
  } catch (error) {
    console.error(error.message)
    res.status(500).send("Server error")
  }
})

// @route  POST /api/profile
// @description Create/Update user profile
// @access Private

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills are not empty").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()})
    }
    const {
      user,
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      experience,
      education,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body
    // profileFields object
    const profileFields = {}
    profileFields.user = req.user.id
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (status) profileFields.status = status
    if (bio) profileFields.bio = bio
    if (githubusername) profileFields.githubusername = githubusername
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim())
    }
    // Build social Object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (twitter) profileFields.social.twitter = twitter
    if (instagram) profileFields.social.instagram = instagram
    if (linkedin) profileFields.social.linkedin = linkedin

    try {
      let profile = await Profile.findOne({user: req.user.id})
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          {user: req.user.id},
          {$set: profileFields},
          {new: true}
        )
        return res.json(profile)
      }
      profile = new Profile(profileFields)
      await profile.save()
      res.json(profile)
    } catch (error) {
      console.error(error.message)
    }
  }
)

// @route  Get /api/profile
// @description all profiles
// @access public

router.get("/", async (req, res) => {
  try {
    let profiles = await Profile.find().populate("user", ["name", "avatar"])
    res.json(profiles)
  } catch (error) {
    console.error(error.message)
    res.status(500).send("Server error")
  }
})

// @route get /api/profile/user/:user_id
// @desc get profile by user id
// @access public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"])
    if (!profile) {
      return res.status(400).send("There is no profile for this user")
    }
    res.json(profile)
  } catch (error) {
    console.error(error.message)
    if (error.kind == "ObjectId") {
      res.status(400).send("There is no profile for this user")
    }
    res.status(500).send("Server error")
  }
})

// @route 						delete /api/pofile
// @description       DELETE user's profile and user details
// @access 						Private

router.delete("/", auth, async (req, res) => {
  try {
    // @todo remove users post

    // remove profile
    await Profile.findOneAndRemove({user: req.user.id})
    // remove user
    await User.findOneAndRemove({user: req.user.id})
    res.json({msg: "User deleted"})
  } catch (error) {
    console.error(error.message)
    res.status(500).send("Server error")
  }
})

// @route     PUT /api/profile/experience
// @desc 			PUT add profile experience
// @accesss   Private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "title is required").not().isEmpty(),
      check("company", "company is required").not().isEmpty(),
      check("from", "from date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()})
    }
    const {title, company, location, from, to, current, description} = req.body
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    }
    try {
      const profile = await Profile.findOne({user: req.user.id})
      profile.experience.unshift(newExp)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  }
)

// @route     DELETE /api/profile/experience
// @desc 			delete profile experience based on exp_id
// @accesss   Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({user: req.user.id})
    let remExp = profile.experience.indexOf(req.params.exp_id)
    profile.experience.splice(remExp, 1)
    await profile.save()
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route PUT /api/porfile/education
// @desc add education
// @private

router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("fieldofstudy", "fieldofstudy is required").not().isEmpty(),
      check("degree", "degree is required").not().isEmpty(),
      check("from", "from is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()})
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      status,
      description,
    } = req.body
    const newEdu = {school, degree, fieldofstudy, from, to, status, description}
    try {
      const profile = await Profile.findOne({user: req.user.id})
      profile.education.unshift(newEdu)
      profile.save()
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      res.status(500).send("Server error")
    }
  }
)

// @route     DELETE /api/profile/education
// @desc 			delete profile education based on edu_id
// @accesss   Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({user: req.user.id})
    console.log(req.params, "sreenivas req.params")
    let remEdu = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id)
    profile.education.splice(remEdu, 1)
    await profile.save()
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// @route  GET /api/profile/github/:username
// @desc   GET github profile info
// @access public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/user/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id
			=${config.get("githubClientId")}&client_secret=${config.get(
        "githubClientSecret"
      )}`,
      method: "GET",
      headers: {user_agent: "node.js"},
    }
    await request(options, (error, response, body) => {
      if (error) console.error(error)
      if (response.statusCode !== 200) {
        res.status(404).json("There is no github profile for this user")
      }
      res.json(JSON.parse(body))
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

module.exports = router
