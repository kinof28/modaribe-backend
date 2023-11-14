
const logout = async (req, res) => {
  res.clearCookie('token');
 res.send({ status: 200, msg: 'Logged Out' });
};

module.exports = logout