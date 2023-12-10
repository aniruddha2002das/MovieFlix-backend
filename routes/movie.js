const express = require("express");
const { isAuth, isAdmin } = require("../middleware/auth");
const { uploadVideo, uploadImage } = require("./../middleware/multer");
const {
  uploadTrailer,
  createMovie,
  updateMovie,
  getMovies,
  getMovieForUpdate,
  removeMovie,
  searchMovies,
  getLatestUploads,
  getSingleMovie,
  getRelatedMovie,
  getTopRatedMovies,
  searchPublicMovies
} = require("../controllers/movie");
const { parseData } = require("../utils/helper");
const { validateMovie, validate, validateTrailer } = require("./../middleware/validator");
const router = express.Router();

router.post(
  "/upload-trailer",
  isAuth,
  isAdmin,
  uploadVideo.single("video"),
  uploadTrailer
);

router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validateTrailer,
  validate,
  createMovie
);

router.patch(
  "/update/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validate,
  updateMovie
);

router.get("/movies", isAuth, isAdmin, getMovies);
router.get("/for-update/:movieId", isAuth, isAdmin, getMovieForUpdate);
router.delete("/:movieId", isAuth, isAdmin, removeMovie);
router.get("/search", isAuth, isAdmin, searchMovies);
router.get("/search-public",  searchPublicMovies);

// for normal users
router.get("/latest-uploads", getLatestUploads);
router.get("/single/:movieId", getSingleMovie);
router.get("/related/:movieId", getRelatedMovie);
router.get("/top-rated", getTopRatedMovies);

module.exports = router;
