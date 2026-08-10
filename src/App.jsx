import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);

  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [expenses, setExpenses] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenseDate, setExpenseDate] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --------------------------------
  // CHECK LOGIN SESSION
  // --------------------------------

  useEffect(() => {
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        loadExpenses(session.user.id);
      } else {
        setExpenses([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session) {
      loadExpenses(session.user.id);
    }
  }

  // --------------------------------
  // SIGN UP
  // --------------------------------

  async function handleSignup(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
        });

      if (profileError) {
        console.log(profileError);
      }
    }

    setMessage(
      "Account created. Check your email if email confirmation is enabled."
    );

    setFullName("");
    setEmail("");
    setPassword("");

    setLoading(false);
  }

  // --------------------------------
  // LOGIN
  // --------------------------------

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    }

    setLoading(false);
  }

  // --------------------------------
  // LOGOUT
  // --------------------------------

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // --------------------------------
  // LOAD USER EXPENSES
  // --------------------------------

  async function loadExpenses(userId) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log(error);
      return;
    }

    setExpenses(data || []);
  }

  // --------------------------------
  // ADD EXPENSE
  // --------------------------------

  async function handleAddExpense(e) {
    e.preventDefault();

    if (!title || !amount) {
      setMessage("Please enter title and amount.");
      return;
    }

    const user = session.user;

    const { error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        title: title,
        amount: Number(amount),
        category: category,
        expense_date: expenseDate || null,
        description: description,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setAmount("");
    setCategory("Food");
    setExpenseDate("");
    setDescription("");

    setMessage("Expense added successfully.");

    loadExpenses(user.id);
  }

  // --------------------------------
  // DELETE EXPENSE
  // --------------------------------

  async function deleteExpense(id) {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadExpenses(session.user.id);
  }

  // --------------------------------
  // TOTAL
  // --------------------------------

  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  // --------------------------------
  // LOGIN / SIGNUP PAGE
  // --------------------------------

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">

          <h1>Expense Tracker</h1>

          <p className="subtitle">
            {mode === "login"
              ? "Login to your account"
              : "Create your account"}
          </p>

          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "login" ? (
            <button
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          ) : (
            <button
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>
          )}

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <div className="switch">
            {mode === "login" ? (
              <>
                Don't have an account?
                <button
                  className="link-button"
                  onClick={() => {
                    setMode("signup");
                    setMessage("");
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button
                  className="link-button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                >
                  Login
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    );
  }

  // --------------------------------
  // DASHBOARD
  // --------------------------------

  return (
    <div className="dashboard">

      <header>
        <div>
          <h1>Expense Tracker</h1>
          <p>{session.user.email}</p>
        </div>

        <button onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="summary">

        <div className="summary-card">
          <h3>Total Expenses</h3>
          <h2>₹{totalExpense.toFixed(2)}</h2>
        </div>

        <div className="summary-card">
          <h3>Number of Expenses</h3>
          <h2>{expenses.length}</h2>
        </div>

      </div>

      <div className="content">

        <section className="form-card">

          <h2>Add Expense</h2>

          <form onSubmit={handleAddExpense}>

            <input
              type="text"
              placeholder="Expense title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Food</option>
              <option>Travel</option>
              <option>Shopping</option>
              <option>Education</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>

            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            <button type="submit">
              Add Expense
            </button>

          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

        </section>

        <section className="expenses-card">

          <h2>My Expenses</h2>

          {expenses.length === 0 ? (
            <p>No expenses yet.</p>
          ) : (
            <div className="expense-list">

              {expenses.map((expense) => (
                <div
                  className="expense-item"
                  key={expense.id}
                >

                  <div>
                    <h3>{expense.title}</h3>

                    <p>
                      Category: {expense.category}
                    </p>

                    <p>
                      Date: {expense.expense_date || "Not specified"}
                    </p>

                    {expense.description && (
                      <p>
                        {expense.description}
                      </p>
                    )}
                  </div>

                  <div className="expense-right">

                    <strong>
                      ₹{Number(expense.amount).toFixed(2)}
                    </strong>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteExpense(expense.id)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>

    </div>
  );
}

export default App;