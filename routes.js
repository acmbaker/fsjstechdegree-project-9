"use strict";
//Import dependencies
const express = require("express");
const { User, Course } = require("./models");
const { authenticateUser } = require("./middleware/authentication");

const router = express.Router();

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

//Route that returns a list of users.
router.get(
  "/users",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const user = req.currentUser;
    res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
    });
  })
);

//Route that creates a new user.
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    try {
      await User.create(req.body);
      res.location("/");
      res.status(201).end();
    } catch (error) {
      // console.log('Error', error.name);
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

//Get route that returns all courses
router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const course = await Course.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          attributes: { exclude: ["createdAt", "updatedAt", "password"] },
        },
      ],
    });
    if (course) {
      res.status(200).json(course);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  })
);

//Get route that returns one course
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: User,
          attributes: { exclude: ["createdAt", "updatedAt", "password"] },
        },
      ],
    });
    if (course) {
      res.status(200).json(course);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  })
);

//Post route that creates a new course
router.post(
  "/courses",
  authenticateUser,
  asyncHandler(async (req, res) => {
    try {
      const course = await Course.create(req.body);
      res.location(`/courses/${course.id}`);
      res.status(201).end();
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

//Updates a course
router.put(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    let course = await Course.findByPk(req.params.id);
    try {
      if (course && req.currentUser.id === course.userId) {
        course.title = req.body.title,
        course.description = req.body.description,
        course.estimatedTime = req.body.estimatedTime,
        course.materialsNeeded = req.body.materialsNeeded
        await course.update(req.body);
        res.status(204).end();
      } else {
        res.status(403).end();
      }
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

//Delete route that deletes a course
router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    let course = await Course.findByPk(req.params.id);
    if (course && req.currentUser.id === course.userId) {
      await course.destroy();
      res.status(204).end();
    } else {
      res.status(403).end();
    }
  })
);

module.exports = router;