const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route 						GET /api/auth
// @description       test route for auth
// @access 						public

router.get('/', auth,  async (req, res) => {
		try{
			let user = await User.findById(req.user.id).select('-password');
			res.json( user);
		}catch(err){
			console.error(err.message);
			res.status(500).send('something went wrong')
		}
	});

router.post('/', async(req, res) => {
	try{
		const {email, password} = req.body;
		const user = await User.findOne({email});
		if(!user){
			return res
							.status(400)
							.json({errors: [{msg: 'user not exist'}]});
			}
		const isMatch = await bcrypt.compare(password, user.password);
		if(!isMatch){
			return res.status(403).json({errors: [{msg: 'password wrong'}]});
			}
			const payload = {
		user:{
			id: user.id
			}
		};
		jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000}, (err, token) => {
		 if(err) throw err;
		 res.json({token})
	 });
	}
	catch(err){
		console.error(err.message);
		res.status(500).send('server error');
	}
})

module.exports = router;