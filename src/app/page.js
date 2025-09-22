'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ title: '', author: '', status: 'Available' });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Load books from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('books');
    if (stored) setBooks(JSON.parse(stored));
  }, []);

  // Save books to localStorage
  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books]);

  // Handle form changes
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.status) return;

    if (editId) {
      setBooks((prev) =>
        prev.map((b) => (b.id === editId ? { ...b, ...form } : b))
      );
      setEditId(null);
    } else {
      setBooks([...books, { id: crypto.randomUUID(), ...form }]);
    }

    setForm({ title: '', author: '', status: 'Available' });
  };

  const handleEdit = (id) => {
    const b = books.find((b) => b.id === id);
    if (b) {
      setForm({ title: b.title, author: b.author, status: b.status });
      setEditId(id);
    }
  };

  const handleDelete = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (editId === id) {
      setEditId(null);
      setForm({ title: '', author: '', status: 'Available' });
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all books?')) {
      setBooks([]);
      localStorage.removeItem('books');
    }
  };

  const handleSort = (field) => {
    const order = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(order);
  };

  // Apply search and sorting
  const filteredBooks = books
    .filter(
      (b) =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortBy) return 0;
      const valA = a[sortBy].toLowerCase();
      const valB = b[sortBy].toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          📚 Book Collection Tracker
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT: FORM */}
          <div className="md:w-1/3 w-full">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-lg px-6 py-6 border"
            >
              <h2 className="text-xl font-semibold mb-4">
                {editId ? 'Edit Book' : 'Add New Book'}
              </h2>

              <div className="mb-4">
                <label className="block font-medium mb-1">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter book title"
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-black"
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-1">Author</label>
                <input
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  required
                  placeholder="Enter author name"
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-black"
                />
              </div>

              <div className="mb-6">
                <label className="block font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-black"
                >
                  <option>Available</option>
                  <option>Borrowed</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded w-full"
              >
                {editId ? 'Update Book' : 'Add Book'}
              </button>

              {books.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded w-full"
                >
                  Clear All Books
                </button>
              )}
            </form>
          </div>

          {/* RIGHT: SEARCH + TABLE */}
          <div className="md:w-2/3 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <input
                type="text"
                placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full sm:w-1/2 bg-white text-black"
              />

              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => handleSort('title')}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                >
                  Sort by Title
                </button>
                <button
                  onClick={() => handleSort('author')}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                >
                  Sort by Author
                </button>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-lg border p-4">
              <p className="mb-2 text-sm text-gray-600">
                📚 {filteredBooks.length} book(s) found
              </p>

              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-200 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Author</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map((book) => (
                      <tr key={book.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2">{book.title}</td>
                        <td className="px-4 py-2">{book.author}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              book.status === 'Available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {book.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          <button
                            onClick={() => handleEdit(book.id)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(book.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        No books found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
