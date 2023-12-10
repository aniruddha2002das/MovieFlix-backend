const { isValidObjectId } = require("mongoose");
const Movie = require("../models/movie");
const Review = require("../models/review");
const { getAverageRatings } = require("../utils/helper");

exports.addReview = async (req, res) => {
  const { movieId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  if(!req.user.isVerified) return res.status(403).send({error: 'Please verify your email first!'});

  if (!isValidObjectId(movieId))
    return res.status(404).send({
      error: "Invalid movie!",
    });

  const movie = await Movie.findOne({ _id: movieId, status: "public" });
  if (!movie)
    return res.status(404).send({
      error: "Movie not found!",
    });

  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: movie._id,
  });

  if (isAlreadyReviewed)
    return res.status(404).send({
      error: "Invalid request, review is already their!",
    });

  // create and update review.
  const newReview = new Review({
    owner: userId,
    parentMovie: movie._id,
    content,
    rating,
  });

  // updating review for movie.
  movie.reviews.push(newReview._id);
  await movie.save();

  // saving new review
  await newReview.save();

  const reviews = await getAverageRatings(movie._id);

  res.status(201).send({ message: "Your review has been added.", reviews });
};

exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { content, rating } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(reviewId))
    return res.status(404).send({
      error: "Invalid review ID!",
    });

  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review)
    return res.status(404).send({
      error: "Review not found!",
    });

  review.content = content;
  review.rating = rating;

  await review.save();

  res.status(201).send({ message: "Your review has been updated." });
};

exports.removeReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(reviewId))
    return res.status(404).send({
      error: "Invalid review ID!",
    });

  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review)
    return res.status(404).send({
      error: "Invalid Request! Review not found!",
    });

  const movie = await Movie.findById(review.parentMovie).select("reviews");
  movie.reviews = movie.reviews.filter((rId) => rId.toString() !== reviewId);

  await Review.findByIdAndDelete(reviewId);

  await movie.save();

  res.status(200).send({ message: "Review removed successfully." });
};

exports.getReviewsByMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId))
    return res.status(404).send({
      error: "Invalid movie ID!",
    });

  const movie = await Movie.findById(movieId)
    .populate({
      path: "reviews",
      populate: {
        path: "owner",
        select: "name",
      },
    })
    .select("reviews title");

  const reviews = movie.reviews.map((r) => {
    const { owner, content, rating, _id: reviewID } = r;
    const { name, _id: ownerId } = owner;

    return {
      id: reviewID,
      owner: {
        id: ownerId,
        name,
      },
      content,
      rating,
    };
  });

  res.status(200).send({ movie: { title: movie.title, reviews } });
};
