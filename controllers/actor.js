const Actor = require("./../models/actor");
const { isValidObjectId } = require("mongoose");
const cloudinary = require("../cloud");
const { uploadImageToCloud, formatActor } = require("../utils/helper");
const actor = require("./../models/actor");

exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;

  const newActor = await Actor.create({ name, about, gender });

  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    newActor.avatar = { url, public_id };
  }

  await newActor.save();

  res.status(201).send({ actor: formatActor(newActor) });
};

exports.updateActor = async (req, res) => {
  const { name, about, gender } = req.body;
  const { file } = req;
  const { actorId } = req.params;

  if (!isValidObjectId(actorId)) {
    res.status(404).send({
      error: "Invalid request!",
    });
  }

  const actor = await Actor.findById(actorId);
  if (!actor) {
    res.status(404).send({
      error: "Invalid request! record not found!",
    });
  }

  const public_id = actor.avatar?.public_id;

  //* remove old avatar if there was one!
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return res.status(404).send({
        error: "Could not remove image from cloud!",
      });
    }
  }

  //* upload new avatar it there is one!
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    actor.avatar = { url, public_id };
  }

  actor.name = name;
  actor.about = about;
  actor.gender = gender;

  await actor.save();

  res.status(201).send({ actor: formatActor(actor) });
};

exports.removeActor = async (req, res) => {
  const { actorId } = req.params;
  // console.log(actorId);
  if (!isValidObjectId(actorId)) {
    res.status(404).send({
      error: "Invalid Request!",
    });
  }

  const actor = await Actor.findById(actorId);
  if (!actor) {
    res.status(404).send({
      error: "Invalid request, Recond not found!",
    });
  }

  const public_id = actor.avatar?.public_id;

  //* remove old avatar!
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return res.status(404).send({
        error: "Could not remove image from cloud!",
      });
    }
  }

  await Actor.findByIdAndDelete(actorId);

  res.status(200).send({
    message: "Record removed successfully!",
  });
};

exports.searchActor = async (req, res) => {
  const { query } = req;

  if (!query.name) {
    res.status(404).send({
      error: "Invalid request!!",
    });
  }

  // const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
  const result = await Actor.find({
    name: { $regex: query.name, $options: "i" },
  });

  const actors = result.map((actor) => formatActor(actor)); //! results is an array so I have to formate each actor

  res.status(200).send({ results: actors });
};

exports.getLatestActors = async (req, res) => {
  const result = await Actor.find().sort({ createdAt: "-1" }).limit(12);

  const actors = result.map((actor) => formatActor(actor));
  res.status(200).send(actors);
};

exports.getSingleActor = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(404).send({
      error: "Invalid request!",
    });
  }

  const actor = await Actor.findById(id);
  if (!actor) {
    res.status(404).send({
      error: "Invalid request! record not found!",
    });
  }

  res.status(200).send({ actor: formatActor(actor) });
};

exports.getActors = async (req, res) => {
  const { pageNo, limit } = req.query;

  const actors = await Actor.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  const profiles = actors.map((actor) => formatActor(actor));

  res.status(200).send({
    profiles,
  });
};
