# PLP Bookstore — Week 1 (MongoDB)

This project demonstrates MongoDB fundamentals:
- CRUD, advanced filters, projection, sorting
- Pagination (limit/skip)
- Aggregations (avg price by genre, author with most books, group by decade)
- Indexing + `explain()` performance demonstration

## Files
- `insert_books.js` — seeds `plp_bookstore.books` with mock data
- `queries.js` — runs all required tasks and prints results
- `.env.example` — optional Atlas connection string template
- `package.json` — scripts and deps

## Setup
1. Install Node.js 18+ and MongoDB (or create MongoDB Atlas cluster).
2. (Optional) Copy `.env.example` → `.env` and set `MONGODB_URI` for Atlas.
3. Install deps:
   ```bash
   npm install
   ```
4. Seed data:
   ```bash
   npm run seed
   ```
5. Run all queries:
   ```bash
   npm run queries
   ```

## Screenshot for submission
Open MongoDB Compass/Atlas and show:
- Database: `plp_bookstore`
- Collection: `books`
- A few sample documents

## Troubleshooting
- **Local connection refused**: ensure `mongod` service is running.
- **Atlas auth issues**: allow your IP and use the full SRV connection string.
- **MongooseError: uri undefined**: this project uses the native driver. Run `node insert_books.js` / `node queries.js`, not a Mongoose script.
