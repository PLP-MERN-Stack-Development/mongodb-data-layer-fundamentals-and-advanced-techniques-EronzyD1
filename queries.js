// queries.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'plp_bookstore';
const collectionName = 'books';

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const books = db.collection(collectionName);

  const sep = (t) => { console.log('\n' + '='.repeat(80)); console.log(t); console.log('='.repeat(80)); };

  try {
    // ---------------- Task 2: Basic CRUD ----------------
    sep('Task 2: Basic CRUD');

    // Find all books in a specific genre
    sep('2.a) Genre = "Fiction"');
    console.table(await books.find({ genre: 'Fiction' }).project({ _id: 0, title: 1, author: 1, genre: 1 }).toArray());

    // Find books published after a certain year
    sep('2.b) Published after 1950');
    console.table(await books.find({ published_year: { $gt: 1950 } }).project({ _id: 0, title: 1, published_year: 1 }).toArray());

    // Find books by a specific author
    sep('2.c) Author = "George Orwell"');
    console.table(await books.find({ author: 'George Orwell' }).project({ _id: 0, title: 1, author: 1 }).toArray());

    // Update the price of a specific book
    sep('2.d) Update price of "The Hobbit" to 15.99');
    await books.updateOne({ title: 'The Hobbit' }, { $set: { price: 15.99 } });
    console.table(await books.find({ title: 'The Hobbit' }).project({ _id: 0, title: 1, price: 1 }).toArray());

    // Delete a book by its title
    sep('2.e) Delete "Animal Farm" and show remaining count');
    await books.deleteOne({ title: 'Animal Farm' });
    console.log('Remaining docs:', await books.countDocuments());
    // restore for idempotency
    await books.updateOne(
      { title: 'Animal Farm' },
      { $setOnInsert: { author: 'George Orwell', genre: 'Political Satire', published_year: 1945, price: 8.50, in_stock: false, pages: 112, publisher: 'Secker & Warburg' } },
      { upsert: true }
    );

    // ---------------- Task 3: Advanced Queries ----------------
    sep('Task 3: Advanced Queries');

    // in_stock and published after 2010
    sep('3.a) In-stock & published after 2010');
    console.table(await books.find({ in_stock: true, published_year: { $gt: 2010 } })
      .project({ _id: 0, title: 1, published_year: 1, in_stock: 1 }).toArray());

    // projection only title, author, price
    sep('3.b) Projection (title, author, price)');
    console.table(await books.find({}).project({ _id: 0, title: 1, author: 1, price: 1 }).toArray());

    // sorting
    sep('3.c) Sort by price ASC');
    console.table(await books.find({}).project({ _id: 0, title: 1, price: 1 }).sort({ price: 1 }).toArray());
    sep('3.c) Sort by price DESC');
    console.table(await books.find({}).project({ _id: 0, title: 1, price: 1 }).sort({ price: -1 }).toArray());

    // pagination 5 per page
    const page = async (p, per = 5) => {
      sep(`3.d) Pagination page ${p}`);
      console.table(await books.find({}).project({ _id: 0, title: 1, author: 1, price: 1 })
        .sort({ title: 1 }).skip((p - 1) * per).limit(per).toArray());
    };
    await page(1); await page(2); await page(3);

    // ---------------- Task 4: Aggregation Pipeline ----------------
    sep('Task 4: Aggregations');

    // avg price by genre
    sep('4.a) Average price by genre');
    console.table(await books.aggregate([
      { $group: { _id: '$genre', avgPrice: { $avg: '$price' }, count: { $sum: 1 } } },
      { $sort: { avgPrice: -1 } }
    ]).toArray());

    // author with most books
    sep('4.b) Author with most books (top 5)');
    console.table(await books.aggregate([
      { $group: { _id: '$author', totalBooks: { $sum: 1 } } },
      { $sort: { totalBooks: -1, _id: 1 } },
      { $limit: 5 }
    ]).toArray());

    // group by publication decade
    sep('4.c) Group by publication decade');
    console.table(await books.aggregate([
      { $addFields: { decade: { $concat: [{ $toString: { $multiply: [{ $floor: { $divide: ['$published_year', 10] } }, 10] } }, 's'] } } },
      { $group: { _id: '$decade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray());

    // ---------------- Task 5: Indexing ----------------
    sep('Task 5: Indexing + explain()');

    // single-field index on title
    sep('5.a) Create index on "title"');
    await books.createIndex({ title: 1 }, { name: 'idx_title_asc' });
    console.table(await books.indexes());

    // compound index
    sep('5.b) Create compound index on { author: 1, published_year: -1 }');
    await books.createIndex({ author: 1, published_year: -1 }, { name: 'idx_author_year' });
    console.table(await books.indexes());

    // explain – compare planner-chosen vs forced COLLSCAN
    sep('5.c) explain() on {author:"George Orwell"} sort {published_year:-1}');
    const q = { author: 'George Orwell' };
    const s = { published_year: -1 };

    const withIndex = await books.find(q).sort(s).explain('executionStats');
    const collscan = await books.find(q).sort(s).hint({ $natural: 1 }).explain('executionStats');

    const pick = (e) => {
      const x = e.executionStats || {};
      return { nReturned: x.nReturned, totalDocsExamined: x.totalDocsExamined, totalKeysExamined: x.totalKeysExamined, executionTimeMillis: x.executionTimeMillis };
    };
    console.log('→ Using index:', pick(withIndex));
    console.log('→ Forced COLLSCAN:', pick(collscan));

    console.log('\n✅ Done.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
