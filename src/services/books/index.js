const express = require("express")
const fs = require("fs")
const uniqid = require("uniqid")
const path = require("path")
const { getBooks, writeBooks } = require("../../fsUtilities")
const { check, validationResult } = require("express-validator")

const booksRouter = express.Router()


const commentValidation = [
  check("userName").exists().withMessage("Username is required!"),
  check("text").exists().withMessage("Comment is required!"),
]



booksRouter.get("/", async (req, res, next) => {
  try {
    const books = await getBooks()

    if (req.query && req.query.category) {
      const filteredBooks = books.filter(
        book =>
          book.hasOwnProperty("category") &&
          book.category === req.query.category
      )
      res.send(filteredBooks)
    } else {
      res.send(books)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.get("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find(book => book.asin === req.params.asin)

    if (bookFound) {
      res.send(bookFound)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

booksRouter.post("/", async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.message = errors
      error.httpStatusCode = 400
      next(error)
    } else {
      const books = await getBooks()

      const asinFound = books.find(book => book.asin === req.body.asin)

      if (asinFound) {
        const error = new Error()
        error.httpStatusCode = 400
        error.message = "Book already in db"
        next(error)
      } else {
        books.push(req.body)
        await writeBooks(books)
        res.status(201).send({ asin: req.body.asin })
      }
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.put("/:asin", async (req, res, next) => {
  try {
    const validatedData = matchedData(req)
    const books = await getBooks()

    const bookIndex = books.findIndex(book => book.asin === req.params.asin)

    if (bookIndex !== -1) {
      // book found
      const updatedBooks = [
        ...books.slice(0, bookIndex),
        { ...books[bookIndex], ...validatedData },
        ...books.slice(bookIndex + 1),
      ]
      await writeBooks(updatedBooks)
      res.send(updatedBooks)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    const err = new Error("An error occurred while reading from the file")
    next(err)
  }
})

booksRouter.delete("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks()

    const bookFound = books.find(book => book.asin === req.params.asin)

    if (bookFound) {
      const filteredBooks = books.filter(book => book.asin !== req.params.asin)

      await writeBooks(filteredBooks)
      res.status(204).send()
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})
booksRouter.post(
  "/:asin/comments",
  commentValidation,
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);

      if (validationErrors.isEmpty()) {
        const books = await getBooks();
        const filteredBook = books.find(
          (book) => book.asin === req.params.asin
        );
        if (filteredBook) {
          if (filteredBook.hasOwnProperty("comments")) {
            filteredBook.comments.push({
              ...req.body,
              commentID: uniqid(),
              createdAt: new Date(),
            });
          } else {
            filteredBook.comments = [];
            filteredBook.comments.push({
              ...req.body,
              commentID: uniqid(),
              createdAt: new Date(),
            });
          }

          await writeBooks(books);

          res.status(201).send(filteredBook.comments);
        } else {
          const err = new Error();
          err.message = "Book ID not found";
          err.httpStatusCode = 404;
          next(err);
        }
      } else {
        const err = new Error();
        err.message = validationErrors;
        err.httpStatusCode = 400;
        next(err);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
)
booksRouter.delete("/:asin/comments/:commentId", async (req, res, next) => {
  try {
    const books = await getBooks();

    const bookIndex = books.findIndex((book) => book.asin === req.params.asin);
    console.log(bookIndex);
    if (bookIndex !== -1) {
      books[bookIndex].comments = books[bookIndex].comments.filter(
        (comment) => comment.commentID !== req.params.commentId
      );
      console.log(books[bookIndex]);
      await writeBooks(books);
      res.status(204).send();
    } else {
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.get("/:asin/comments", async (req, res, next) => {
  try {
    const books = await getBooks();

    const booksFound = books.find((book) => book.asin === req.params.asin);
    console.log("its meeee", booksFound.comments);
    //const comments = booksFound.flat();

    if (booksFound) {
      res.send(booksFound.comments);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});


module.exports = booksRouter
