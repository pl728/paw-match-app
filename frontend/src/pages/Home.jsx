import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <main className = "page-center">
      <section className = "card" aria-labelledby = "home-title">

        <h1 id = "home-title">Welcome</h1>

        <img
          src = {logo}
        />

        <div className = "actions">
          <Link to = "/login" className = "button">Login</Link>
          <Link to = "/createpet" className = "button">Create a Pet</Link>
        </div>
      </section>
    </main>
  );
}
