class ResponseHandler {
  static ok(res, message = "Success", data = null) {
    res.status(200).json({
      status: "success",
      message,
      data,
    });
  }

  static success(res, message = "Created Successfully", data = null) {
    res.status(201).json({
      status: "success",
      message,
      data,
    });
  }
  static badRequest(res, message = "Bad request", errors = null) {
    res.status(400).json({
      status: "fail",
      message,
      errors,
    });
  }
  static unauthorized(res, message = "Unauthorized") {
    res.status(401).json({
      status: "fail",
      message,
    });
  }

  static notFound(res, message = "Not Found") {
    res.status(404).json({
      status: "fail",
      message,
    });
  }
  static serverError(res, message = "Internal Server Error") {
    res.status(500).json({
      status: "fail",
      message,
    });
  }
}

export default ResponseHandler;
