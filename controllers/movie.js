const { isValidObjectId } = require("mongoose");
const cloudinary = require("../cloud");
const Movie = require("./../models/movie");
const Review = require("./../models/review");
const {
  formatActor,
  averageRatingPipeline,
  relatedMovieAggregation,
  getAverageRatings,
  topRatedMoviesPipeline,
} = require("../utils/helper");

exports.uploadTrailer = async (req, res) => {
  const { file } = req;
  if (!file) {
    res.status(404).send({
      error: "Video file is missing!",
    });
  }

  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file.path,
    {
      resource_type: "video",
    }
  );

  res.status(201).send({ url, public_id });
};

exports.createMovie = async (req, res) => {
  const { file, body } = req;

  const {
    title,
    storyLine,
    director,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = body;

  const newMovie = new Movie({
    title,
    storyLine,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    trailer,
    language,
  });

  if (director) {
    if (!isValidObjectId(director)) {
      return res.status(401).send({
        error: "Invalid director id!",
      });
    }
    newMovie.director = director;
  }

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId)) {
        return res.status(401).send({
          error: "Invalid writer id!",
        });
      }
    }
    newMovie.writers = writers;
  }

  //* upload posters
  if (file) {
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        max_images: 3,
        max_width: 640,
        create_derived: true,
      },
    });

    const finalPoster = { url, public_id, responsive: [] };
    const { breakpoints } = responsive_breakpoints[0];

    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }
    newMovie.poster = finalPoster;
  }

  await newMovie.save();

  res.status(200).send({
    movie: { id: newMovie.id, title },
  });
};

exports.updateMovie = async (req, res) => {
  const { movieId } = req.params;
  const { file } = req;

  if (!isValidObjectId(movieId)) {
    return res.status(404).send({
      error: "Invalid Movie Id!",
    });
  }

  const movie = await Movie.findById(movieId);

  if (!movie) {
    return res.status(404).send({
      error: "Movie not found!",
    });
  }

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director)) {
      return res.status(401).send({
        error: "Invalid director id!",
      });
    }
    movie.director = director;
  }

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId)) {
        return res.status(401).send({
          error: "Invalid writer id!",
        });
      }
    }
    movie.writers = writers;
  }

  //* update poster
  //* removing poster from cloudinary if there is any

  if (file) {
    const { posterID } = movie.poster?.public_id;

    if (posterID) {
      const { result } = await cloudinary.uploader.destroy(posterID);

      if (result != "ok") {
        return res.status(500).send({
          error: "Couldn't update poster at this moment!",
        });
      }
    }

    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(req.file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        max_images: 3,
        max_width: 640,
        create_derived: true,
      },
    });

    const finalPoster = { url, public_id, responsive: [] };
    const { breakpoints } = responsive_breakpoints[0];

    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }
    movie.poster = finalPoster;
  }

  await movie.save();

  res.status(200).send({
    message: "Movie is updated",
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
};

exports.updateMovieWithoutPoster = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) {
    return res.status(404).send({
      error: "Invalid Movie Id!",
    });
  }

  const movie = await Movie.findById(movieId);
  if (!movie) {
    return res.status(404).send({
      error: "Movie not found!",
    });
  }

  const {
    title,
    storyLine,
    director,
    releaseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  movie.title = title;
  movie.storyLine = storyLine;
  movie.releaseDate = releaseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  if (director) {
    if (!isValidObjectId(director)) {
      return res.status(401).send({
        error: "Invalid director id!",
      });
    }
    movie.director = director;
  }

  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId)) {
        return res.status(401).send({
          error: "Invalid writer id!",
        });
      }
    }
    movie.writers = writers;
  }

  await movie.save();

  res.status(200).send({ message: "Movie is updated", movie });
};

exports.getMovies = async (req, res) => {
  const { pageNo = 0, limit = 10 } = req.query;

  // console.log(pageNo, limit);

  const movies = await Movie.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const results = movies.map((movie) => ({
    id: movie._id,
    title: movie.title,
    poster: movie.poster?.url,
    responsivePosters: movie.poster?.responsive,
    genres: movie.genres,
    status: movie.status,
  }));

  res.status(200).send({
    movies: results,
  });
};

exports.getMovieForUpdate = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) {
    return res.status(404).send({
      error: "Id is not a valid!!",
    });
  }

  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  // console.log("hum");
  res.status(200).send({
    movie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie.poster?.url,
      releseDate: movie.releseDate,
      status: movie.status,
      type: movie.type,
      language: movie.language,
      genres: movie.genres,
      tags: movie.tags,
      director: formatActor(movie.director),
      writers: movie.writers.map((w) => formatActor(w)),
      cast: movie.cast.map((c) => {
        return {
          id: c.id,
          profile: formatActor(c.actor),
          roleAs: c.roleAs,
          leadActor: c.leadActor,
        };
      }),
    },
  });
};

exports.removeMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) {
    return res.status(404).send({
      error: "Id is not a valid!!",
    });
  }

  const movie = await Movie.findById(movieId);
  if (!movie) {
    return res.status(404).send({
      error: "Movie not found",
    });
  }

  // Check there is a poster or not.
  // If Yes then we need to remove.

  const posterId = movie.poster?.public_id;
  if (posterId) {
    const { result } = await cloudinary.uploader.destroy(posterId);
    if (result != "ok") {
      return res.status(404).send({
        error: "Could not remove poster from cloud!",
      });
    }
  }

  // removing trailer
  const trailerId = movie.trailer?.public_id;

  if (!trailerId)
    return res
      .status(404)
      .send({ error: "Could not find trailer in the cloud!" });
  const { result } = await cloudinary.uploader.destroy(trailerId, {
    resource_type: "video",
  });

  if (result !== "ok")
    return res
      .status(404)
      .send({ error: "Could not remove trailer from cloud!" });

  await Movie.findByIdAndDelete(movieId);

  res.status(200).send({ message: "Movie removed successfully." });
};

exports.searchMovies = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return res.status(404).send({ error: "Invalid request!" });

  const movies = await Movie.find({ title: { $regex: title, $options: "i" } });
  res.status(200).send({
    results: movies.map((m) => {
      return {
        id: m._id,
        title: m.title,
        poster: m.poster?.url,
        genres: m.genres,
        status: m.status,
      };
    }),
  });
};

exports.getLatestUploads = async (req, res) => {
  const { limit = 5 } = req.query;

  const results = await Movie.find({ status: "public" })
    .sort("-createdAt")
    .limit(parseInt(limit));

  const movies = results.map((m) => {
    return {
      id: m._id,
      title: m.title,
      storyLine: m.storyLine,
      poster: m.poster?.url,
      responsivePosters: m.poster.responsive,
      trailer: m.trailer?.url,
    };
  });
  res.status(200).send({ movies });
};

exports.getSingleMovie = async (req, res) => {
  const { movieId } = req.params;

  // mongoose.Types.ObjectId(movieId)

  if (!isValidObjectId(movieId))
    return sendError(res, "Movie id is not valid!");

  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  const [aggregatedResponse] = await Review.aggregate(
    averageRatingPipeline(movie._id)
  );

  const reviews = {};

  if (aggregatedResponse) {
    const { ratingAvg, reviewCount } = aggregatedResponse;
    reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
    reviews.reviewCount = reviewCount;
  }

  const {
    _id: id,
    title,
    storyLine,
    cast,
    writers,
    director,
    releseDate,
    genres,
    tags,
    language,
    poster,
    trailer,
    type,
  } = movie;

  res.json({
    movie: {
      id,
      title,
      storyLine,
      releseDate,
      genres,
      tags,
      language,
      type,
      poster: poster?.url,
      trailer: trailer?.url,
      cast: cast.map((c) => ({
        id: c._id,
        profile: {
          id: c.actor._id,
          name: c.actor.name,
          avatar: c.actor?.avatar?.url,
        },
        leadActor: c.leadActor,
        roleAs: c.roleAs,
      })),
      writers: writers.map((w) => ({
        id: w._id,
        name: w.name,
      })),
      director: {
        id: director._id,
        name: director.name,
      },
      reviews: { ...reviews },
    },
  });
};

exports.getRelatedMovie = async (req, res) => {
  const { movieId } = req.params;

  if (!isValidObjectId(movieId)) {
    return res.status(404).send({
      error: "Id is not a valid!!",
    });
  }

  const movie = await Movie.findById(movieId);

  const movies = await Movie.aggregate(
    relatedMovieAggregation(movie.tags, movie._id)
  );

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);

    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const relatedMovies = await Promise.all(movies.map(mapMovies));

  res.status(200).send({ movies: relatedMovies });
};

exports.getTopRatedMovies = async (req, res) => {
  const { type = "Film" } = req.query;

  const movies = await Movie.aggregate(topRatedMoviesPipeline(type));

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);

    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const topRatedMovies = await Promise.all(movies.map(mapMovies));

  // console.log(topRatedMovies)

  res.status(200).send({ movies: topRatedMovies });
};



exports.searchPublicMovies = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return res.status(404).send("Invalid request!");

  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);

    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      responsivePosters: m.poster?.responsive,
      reviews: { ...reviews },
    };
  };

  const results = await Promise.all(movies.map(mapMovies));

  res.status(200).send({
    results,
  });
};


