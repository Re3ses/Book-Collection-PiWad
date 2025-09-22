'use client';

import { useEffect, useState, useMemo } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 5;
const PASSWORD = 'librarian123'; // simple password for authentication

export default function Home() {
  // Authentication
  const [isAuth, setIsAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Books state and form
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    status: 'Available',
    category: '',
    dueDate: '',
  });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Load books and auth from localStorage
  useEffect(() => {
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) setBooks(JSON.parse(storedBooks));

    const storedAuth = localStorage.getItem('isAuth');
    if (storedAuth === 'true') setIsAuth(true);
  }, []);

  // Save books to localStorage
  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books]);

  // Save auth state
  useEffect(() => {
    localStorage.setItem('isAuth', isAuth.toString());
  }, [isAuth]);

  // Handle auth submit
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setIsAuth(true);
    } else {
      alert('Incorrect password!');
      setPasswordInput('');
    }
  };

  // Handle form changes
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () =>
    setForm({ title: '', author: '', status: 'Available', category: '', dueDate: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.status || !form.category) return;

    if (editId) {
      setBooks((prev) =>
        prev.map((b) => (b.id === editId ? { ...b, ...form } : b))
      );
      setEditId(null);
    } else {
      setBooks([...books, { id: crypto.randomUUID(), ...form }]);
    }

    resetForm();
  };

  const handleEdit = (id) => {
    const b = books.find((b) => b.id === id);
    if (b) {
      setForm({
        title: b.title,
        author: b.author,
        status: b.status,
        category: b.category,
        dueDate: b.dueDate || '',
      });
      setEditId(id);
    }
  };

  const handleDelete = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (editId === id) {
      setEditId(null);
      resetForm();
    }
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all books?')) {
      setBooks([]);
      localStorage.removeItem('books');
      setSelectedIds([]);
      setCurrentPage(1);
    }
  };

  const handleSort = (field) => {
    const order = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(order);
  };

  // Bulk Actions
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredBooks.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const bulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.length} selected book(s)?`
      )
    ) {
      setBooks((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    }
  };

  const bulkUpdateStatus = (newStatus) => {
    if (selectedIds.length === 0) return;
    setBooks((prev) =>
      prev.map((b) =>
        selectedIds.includes(b.id) ? { ...b, status: newStatus, dueDate: newStatus === 'Borrowed' ? b.dueDate || getDefaultDueDate() : '' } : b
      )
    );
  };

  // Due date helper: default 14 days from today
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  // Handle mark as returned (set status to Available and clear dueDate)
  const markReturned = (id) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'Available', dueDate: '' } : b))
    );
  };

  // Export CSV
  const exportCSV = () => {
    if (books.length === 0) {
      alert('No books to export');
      return;
    }
    const headers = ['Title', 'Author', 'Status', 'Category', 'Due Date'];
    const rows = books.map((b) => [
      b.title,
      b.author,
      b.status,
      b.category,
      b.dueDate || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((e) => e.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = 'books_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV (simple)
  const importCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(Boolean);
      if (lines.length < 2) {
        alert('CSV is empty or invalid');
        return;
      }
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
      if (!headers.includes('title') || !headers.includes('author')) {
        alert('CSV must have at least Title and Author columns');
        return;
      }
      const newBooks = dataLines.map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const bookObj = {};
        headers.forEach((h, i) => {
          bookObj[h] = values[i] || '';
        });
        return {
          id: crypto.randomUUID(),
          title: bookObj.title || '',
          author: bookObj.author || '',
          status: bookObj.status || 'Available',
          category: bookObj.category || '',
          dueDate: bookObj['due date'] || '',
        };
      });
      setBooks((prev) => [...prev, ...newBooks]);
      e.target.value = ''; // reset file input
    };
    reader.readAsText(file);
  };

  // Apply search and sorting
  const filteredBooks = useMemo(() => {
    return books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase()) ||
          b.category.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (!sortBy) return 0;
        const valA = (a[sortBy] || '').toLowerCase();
        const valB = (b[sortBy] || '').toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [books, search, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / PAGE_SIZE);
  const pagedBooks = filteredBooks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Clear selection on page change or filter change
  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  // Determine if book is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  if (!isAuth) {
    // Simple auth screen
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded shadow max-w-sm  w-full"
        >
          <h1 className="text-2xl font-bold mb-6 text-black text-center">
            Librarian Login
          </h1>
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full border border-gray-300 rounded text-gray-500 px-3 py-2 mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-gray-100 text-gray-900 px-4 py-10">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-12 text-blue-700">
        📚 Book Collection Tracker
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT: FORM */}
        <div className="md:w-1/3 w-full">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-xl px-6 py-8 border border-gray-200"
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {editId ? 'Edit Book' : 'Add New Book'}
            </h2>

            {/* Input Field */}
            {['title', 'author'].map((field) => (
              <div key={field} className="mb-5">
                <label className="block font-medium mb-2 capitalize">{field}</label>
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  required
                  placeholder={`Enter ${field}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            ))}

            {/* Category */}
            <div className="mb-5">
              <label className="block font-medium mb-2">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                <option>Fiction</option>
                <option>Non-fiction</option>
                <option>Biography</option>
                <option>Science Fiction</option>
                <option>Fantasy</option>
                <option>Other</option>
              </select>
            </div>

            {/* Status */}
            <div className="mb-5">
              <label className="block font-medium mb-2">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option>Available</option>
                <option>Borrowed</option>
              </select>
            </div>

            {/* Due Date if Borrowed */}
            {form.status === 'Borrowed' && (
              <div className="mb-6">
                <label className="block font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-full"
              >
                {editId ? 'Update Book' : 'Add Book'}
              </button>

              {books.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg w-full"
                >
                  Clear All Books
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: SEARCH + TABLE + BULK ACTIONS */}
        <div className="md:w-2/3 w-full flex flex-col gap-6">
          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <input
              type="text"
              placeholder="Search by title, author or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-1/2 border border-gray-300 rounded-lg px-3 py-2 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 items-center">
              <p className='text-sm text-center'>Sort By</p>
              {['title', 'author', 'category'].map((col) => (
                <button
                  key={col}
                  onClick={() => handleSort(col)}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg flex items-center gap-1"
                  title={`Sort by ${col}`}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {sortBy === col && <SortArrow direction={sortOrder} />}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedIds.length > 0 &&
                  selectedIds.length === filteredBooks.length
                }
                onChange={toggleSelectAll}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span>Select All</span>
            </label>

            <button
              onClick={bulkDelete}
              disabled={selectedIds.length === 0}
              className={`text-white px-3 py-1 rounded-lg ${
                selectedIds.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Delete Selected
            </button>

            <button
              onClick={() => bulkUpdateStatus('Available')}
              disabled={selectedIds.length === 0}
              className={`text-white px-3 py-1 rounded-lg ${
                selectedIds.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Mark Available
            </button>

            <button
              onClick={() => bulkUpdateStatus('Borrowed')}
              disabled={selectedIds.length === 0}
              className={`text-white px-3 py-1 rounded-lg ${
                selectedIds.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              Mark Borrowed
            </button>

            {/* <button
              onClick={exportCSV}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
            >
              Export CSV
            </button> */}

            {/* <label
              htmlFor="importCsvInput"
              className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg"
              title="Import CSV"
            >
              Import CSV
            </label>
            <input
              id="importCsvInput"
              type="file"
              accept=".csv"
              onChange={importCSV}
              className="hidden"
            /> */}
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-b">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === pagedBooks.length
                      }
                      onChange={(e) => {
                        const pageIds = pagedBooks.map((b) => b.id);
                        setSelectedIds((prev) =>
                          e.target.checked
                            ? Array.from(new Set([...prev, ...pageIds]))
                            : prev.filter((id) => !pageIds.includes(id))
                        );
                      }}
                    />
                  </th>
                  {['title', 'author', 'category'].map((col) => (
                    <th
                      key={col}
                      className="p-3 border-b cursor-pointer"
                      onClick={() => handleSort(col)}
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                      {sortBy === col && <SortArrow direction={sortOrder} />}
                    </th>
                  ))}
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Due Date</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedBooks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6 text-gray-500 italic">
                      No books found
                    </td>
                  </tr>
                ) : (
                  pagedBooks.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-gray-50 ${
                        isOverdue(b.dueDate)
                          ? 'bg-red-50'
                          : b.status === 'Borrowed'
                          ? 'bg-yellow-50'
                          : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(b.id)}
                          onChange={() => toggleSelectOne(b.id)}
                        />
                      </td>
                      <td className="p-3">{b.title}</td>
                      <td className="p-3">{b.author}</td>
                      <td className="p-3">{b.category}</td>
                      <td className="p-3">
                        {b.status}
                        {b.status === 'Borrowed' && isOverdue(b.dueDate) && (
                          <span className="text-red-600 font-bold ml-2">
                            (Overdue)
                          </span>
                        )}
                      </td>
                      <td className="p-3">{formatDate(b.dueDate)}</td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => handleEdit(b.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <PencilIcon className="inline w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="inline w-5 h-5" />
                        </button>
                        {b.status === 'Borrowed' && (
                          <button
                            onClick={() => markReturned(b.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                            title="Mark as Returned"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
);

}

function SortArrow({ direction }) {
  return (
    <svg
      className={`inline w-4 h-4 ml-1 ${
        direction === 'asc' ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}
