import {useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";

import Button from "../ui/Button";
import Input from "../ui/Input";
import {login, register} from "../services/authApi";

function Auth() {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const isRegister = pathname.includes("register");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "buyer",
  });

  function updateField(e) {
    const {name, value} = e.target;
    setForm((current) => ({...current, [name]: value}));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = isRegister
        ? await register(form)
        : await login({email: form.email, password: form.password});

      toast.success(isRegister ? "Account created" : "Logged in");
      navigate(user.role === "seller" ? "/crops" : "/marketplace", {replace: true});
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src="completeLogo.png" alt="FarmSync" className="mx-auto mb-4 h-28 w-auto" />
          <h1 className="text-2xl font-bold text-text-primary">
            {isRegister ? "Create your FarmSync account" : "Log in to FarmSync"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isRegister
              ? "Choose buyer or seller access when you sign up."
              : "Use your FarmSync account to continue."}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="block text-sm font-medium text-text-primary">
              Full name
              <Input
                className="mt-2 w-full"
                name="fullName"
                value={form.fullName}
                onChange={updateField}
                required
                disabled={isLoading}
              />
            </label>
          )}

          <label className="block text-sm font-medium text-text-primary">
            Email
            <Input
              className="mt-2 w-full"
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              required
              disabled={isLoading}
            />
          </label>

          <label className="block text-sm font-medium text-text-primary">
            Password
            <Input
              className="mt-2 w-full"
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              required
              disabled={isLoading}
            />
          </label>

          {isRegister && (
            <fieldset className="rounded-xl border border-border p-4">
              <legend className="px-2 text-sm font-medium text-text-primary">Account type</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className={`cursor-pointer rounded-lg border p-3 text-sm ${form.role === "buyer" ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-border text-text-secondary"}`}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={form.role === "buyer"}
                    onChange={updateField}
                  />
                  Buyer
                  <span className="mt-1 block text-xs text-text-secondary">Buy listings and view orders</span>
                </label>
                <label className={`cursor-pointer rounded-lg border p-3 text-sm ${form.role === "seller" ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-border text-text-secondary"}`}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="role"
                    value="seller"
                    checked={form.role === "seller"}
                    onChange={updateField}
                  />
                  Seller
                  <span className="mt-1 block text-xs text-text-secondary">Create and manage crop listings</span>
                </label>
              </div>
            </fieldset>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {isRegister ? "Already have an account?" : "Need an account?"} {" "}
          <Link className="font-semibold text-brand-primary" to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Log in" : "Register"}
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Auth;
