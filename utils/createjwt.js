const jwt = require('jsonwebtoken');

function createToken(user){
    const payload = {
        id:user.id,
        role:user.role
    };
    return jwt.sign(payload,process.env.JWT_KEY,{expiresIn:process.env.EXPIRATION});
}

module.exports= createToken;