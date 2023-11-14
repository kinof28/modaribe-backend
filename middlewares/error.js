const clientError = (req, res) => {
  res.status(404).json({ message: "Not Found" });
};

const serverError = (error, req, res, next) => {
  if (error.status) {
    res.status(error.status).json({ message: error.message });
  } else {
    res.status(500).json({ message: "Server Error" ,error: error || "no" });
  }
};
module.exports = { clientError, serverError };
